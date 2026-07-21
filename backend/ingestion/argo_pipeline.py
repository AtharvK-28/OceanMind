"""
OceanMind — ARGO Data Ingestion Pipeline (Phase A)

Fetches real ARGO float profiles from the public Argovis API, converts
units (pressure to depth), and ingests into the unified schema.

Live API: Argovis (https://argovis.colorado.edu) — public, no key required.
An optional free key (ARGOVIS_API_KEY) raises the rate limit but isn't needed
to function. Verified live 2026-07-03: real WMO floats reporting inside the
Indian Ocean bbox with timestamps from the last few days.

Without connectivity, or with FALLBACK_DATA_MODE=true (default for MVP demo),
the pipeline generates synthetic profiles matching the same schema.

Note: dissolved_o2 and ph are BGC-sensor measurements not carried by core
Argo floats (which are sparse in the Indian Ocean) — real profiles leave
these columns NULL rather than fabricating values.
"""

import json
import os
from datetime import datetime, timezone, timedelta

import numpy as np
import pandas as pd
import requests
from loguru import logger

from backend.db.connection import get_raw_conn

ARGOVIS_BASE = "https://argovis-api.colorado.edu"
ARGOVIS_API_KEY = os.getenv("ARGOVIS_API_KEY", "")
FALLBACK_MODE = os.getenv("FALLBACK_DATA_MODE", "true").lower() == "true"

# Real profiles can carry 500+ depth levels; subsampled (not interpolated)
# to keep row counts sane for the demo schema (one row per depth reading).
MAX_LEVELS_PER_PROFILE = 12


class ArgoPipeline:
    def __init__(self):
        self.source_system = "ARGO_GDAC"
        self.schema_version = "1.0"
        self.last_fetch_was_live = False

    def fetch_recent_profiles(
        self,
        lat_min: float = 5.0,
        lat_max: float = 25.0,
        lon_min: float = 60.0,
        lon_max: float = 100.0,
        days_back: int = 10,
    ) -> pd.DataFrame:
        """
        Fetches recent ARGO float profiles for the Indian EEZ bounding box.

        Live: Argovis REST API (real WMO floats, real temperature/salinity/
        pressure readings). Fallback: synthetic profiles, same schema.
        """
        if FALLBACK_MODE:
            logger.info("ARGO: FALLBACK_DATA_MODE=true, using synthetic profiles (set to 'false' for live data).")
            self.last_fetch_was_live = False
            return self._generate_synthetic(lat_min, lat_max, lon_min, lon_max)

        try:
            df = self._fetch_live(lat_min, lat_max, lon_min, lon_max, days_back)
            self.last_fetch_was_live = True
            return df
        except Exception as exc:
            logger.warning(f"ARGO live fetch failed ({exc}). Falling back to synthetic data.")
            self.last_fetch_was_live = False
            return self._generate_synthetic(lat_min, lat_max, lon_min, lon_max)

    def ingest_to_db(self, df: pd.DataFrame):
        """
        Ingests processed ARGO profiles to the database.
        Note: Bubble assignment should happen before this step.
        """
        if df.empty:
            return

        logger.info("Ingesting ARGO profiles to DB...")

        insert_sql = """
            INSERT INTO argo_profiles (
                bubble_id, float_id, platform_num, datetime, latitude, longitude,
                depth_m, temperature_c, salinity_psu, dissolved_o2, ph,
                quality_flag, source_system, schema_version
            ) VALUES (
                %(bubble_id)s, %(float_id)s, %(platform_num)s, %(datetime)s, %(latitude)s, %(longitude)s,
                %(depth_m)s, %(temperature_c)s, %(salinity_psu)s, %(dissolved_o2)s, %(ph)s,
                %(quality_flag)s, %(source_system)s, %(schema_version)s
            )
        """

        records = df.to_dict('records')

        try:
            with get_raw_conn() as conn:
                cursor = conn.cursor()
                cursor.executemany(insert_sql, records)
                conn.commit()
            logger.success(f"Successfully ingested {len(records)} ARGO profiles.")
        except Exception as e:
            logger.error(f"Failed to ingest ARGO data: {e}")

    # ──────────────────────────────────────────────────────────────────────────
    # Live Argovis API
    # ──────────────────────────────────────────────────────────────────────────

    def _fetch_live(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        days_back: int,
    ) -> pd.DataFrame:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
        box = [[lon_min, lat_min], [lon_max, lat_max]]

        headers = {"x-argokey": ARGOVIS_API_KEY} if ARGOVIS_API_KEY else {}
        params = {
            "startDate": start_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "endDate": end_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "box": json.dumps(box, separators=(",", ":")),
            "data": "temperature,salinity,pressure",
        }

        logger.info(f"ARGO live fetch: Argovis API, {start_date.date()} -> {end_date.date()}, bbox {box}")
        resp = requests.get(f"{ARGOVIS_BASE}/argo", headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        profiles = resp.json()

        if not isinstance(profiles, list):
            raise ValueError(f"Unexpected Argovis response shape: {type(profiles)}")

        rows = []
        for p in profiles:
            coords = p.get("geolocation", {}).get("coordinates", [None, None])
            lon, lat = coords[0], coords[1]
            ts = p.get("timestamp")
            data_info = p.get("data_info")
            data = p.get("data")
            if not data_info or not data or lat is None or lon is None:
                continue

            var_names = data_info[0]
            try:
                pres_idx = var_names.index("pressure")
                temp_idx = var_names.index("temperature")
                sal_idx = var_names.index("salinity")
            except ValueError:
                continue

            pres_series = data[pres_idx]
            temp_series = data[temp_idx]
            sal_series = data[sal_idx]
            n_levels = len(pres_series)
            if n_levels == 0:
                continue
            step = max(1, n_levels // MAX_LEVELS_PER_PROFILE)

            for i in range(0, n_levels, step):
                pres = pres_series[i]
                if pres is None:
                    continue
                temp = temp_series[i] if i < len(temp_series) else None
                sal = sal_series[i] if i < len(sal_series) else None
                depth_m = 0.994 * pres + 0.0002 * (pres ** 2)

                rows.append({
                    "float_id": f"WMO_{p.get('_id', 'UNKNOWN').split('_')[0]}",
                    "platform_num": p.get("_id", "UNKNOWN"),
                    "datetime": pd.to_datetime(ts) if ts else end_date,
                    "latitude": lat,
                    "longitude": lon,
                    "depth_m": round(depth_m, 1),
                    "temperature_c": temp,
                    "salinity_psu": sal,
                    "dissolved_o2": None,  # not measured by core Argo floats (BGC-only, sparse in Indian Ocean)
                    "ph": None,            # not measured by core Argo floats (BGC-only, sparse in Indian Ocean)
                    "quality_flag": "GOOD",
                    "source_system": self.source_system,
                    "schema_version": self.schema_version,
                })

        if not rows:
            raise ValueError("Argovis returned zero usable depth readings for this window/bbox.")

        df = pd.DataFrame(rows)
        logger.success(f"ARGO live: parsed {len(df)} real depth readings from {len(profiles)} floats.")
        return df

    # ──────────────────────────────────────────────────────────────────────────
    # Synthetic fallback
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_synthetic(
        self,
        lat_min: float = 5.0,
        lat_max: float = 25.0,
        lon_min: float = 60.0,
        lon_max: float = 100.0,
    ) -> pd.DataFrame:
        """Synthetic profiles matching the expected schema (MVP fallback demo)."""
        now = datetime.now(timezone.utc)
        data = []
        for i in range(10):
            pres = np.random.uniform(10, 1000)
            depth_m = 0.994 * pres + 0.0002 * (pres ** 2)

            data.append({
                "float_id": f"WMO_{np.random.randint(1000000, 9999999)}",
                "platform_num": "PROFILER",
                "datetime": now,
                "latitude": np.random.uniform(lat_min, lat_max),
                "longitude": np.random.uniform(lon_min, lon_max),
                "depth_m": depth_m,
                "temperature_c": np.random.normal(25 - (depth_m / 100), 2),
                "salinity_psu": np.random.normal(35, 0.5),
                "dissolved_o2": np.random.uniform(100, 300),
                "ph": np.random.normal(8.1, 0.1),
                "quality_flag": "GOOD",
                "source_system": self.source_system,
                "schema_version": self.schema_version,
            })

        logger.info(f"ARGO synthetic: generated {len(data)} profiles.")
        return pd.DataFrame(data)
