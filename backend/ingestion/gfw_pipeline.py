"""
OceanMind — GFW AIS Data Ingestion Pipeline (Phase A)

Fetches Global Fishing Watch (GFW) fishing effort density and vessel
track data, runs it through the 5-stage AIS quality pipeline, and
ingests into the unified `gfw_ais` schema.

Live API requires GFW_API_KEY in .env.
Without a key the pipeline generates realistic synthetic AIS data
matching the same schema (FALLBACK_DATA_MODE=true).

GFW API docs: https://globalfishingwatch.org/data-download/datasets/public-fishing-effort
"""

import os
from datetime import datetime, timezone, timedelta

import numpy as np
import pandas as pd
import requests
from loguru import logger

from backend.db.connection import get_raw_conn
from backend.processing.ais_quality import AISQualityPipeline

GFW_API_BASE = "https://gateway.api.globalfishingwatch.org/v3"
GFW_API_KEY  = os.getenv("GFW_API_KEY", "")
FALLBACK_MODE = os.getenv("FALLBACK_DATA_MODE", "true").lower() == "true"


class GFWPipeline:
    """
    GFW AIS ingestion pipeline.

    Two modes:
      - Live: calls GFW REST API for fishing effort density tiles
      - Fallback (default for MVP): generates synthetic AIS records
        with realistic vessel movement patterns across the Indian EEZ
    """

    def __init__(self):
        self.source_system   = "GFW_AIS"
        self.schema_version  = "1.0"
        self.ais_qc          = AISQualityPipeline()
        self.last_fetch_was_live = False

    # ──────────────────────────────────────────────────────────────────────────
    # Public interface
    # ──────────────────────────────────────────────────────────────────────────

    def fetch_recent_effort(
        self,
        lat_min: float = 5.0,
        lat_max: float = 25.0,
        lon_min: float = 60.0,
        lon_max: float = 100.0,
        days_back: int = 7,
    ) -> pd.DataFrame:
        """
        Fetch fishing effort density for the Indian EEZ bounding box.

        Returns a DataFrame with columns:
          mmsi, datetime, latitude, longitude, fishing_hours,
          vessel_class, flag_state, quality_flag, source_system, schema_version
        """
        if GFW_API_KEY and not FALLBACK_MODE:
            return self._fetch_live(lat_min, lat_max, lon_min, lon_max, days_back)
        else:
            logger.info("GFW: using synthetic fallback (set GFW_API_KEY + FALLBACK_DATA_MODE=false for live data)")
            self.last_fetch_was_live = False
            return self._generate_synthetic(lat_min, lat_max, lon_min, lon_max, days_back)

    def ingest_to_db(self, df: pd.DataFrame) -> None:
        """
        Ingest processed AIS records into the `gfw_ais` table.
        bubble_id must already be assigned before calling this.
        """
        if df.empty:
            logger.warning("GFW ingest: empty DataFrame, skipping.")
            return

        insert_sql = """
            INSERT INTO gfw_ais (
                bubble_id, mmsi, datetime, latitude, longitude,
                fishing_hours, vessel_class, flag_state,
                quality_flag, source_system, schema_version
            ) VALUES (
                %(bubble_id)s, %(mmsi)s, %(datetime)s, %(latitude)s, %(longitude)s,
                %(fishing_hours)s, %(vessel_class)s, %(flag_state)s,
                %(quality_flag)s, %(source_system)s, %(schema_version)s
            )
            ON CONFLICT DO NOTHING;
        """

        # Ensure bubble_id column exists (may be None before assignment)
        if "bubble_id" not in df.columns:
            df["bubble_id"] = None

        records = df[
            [
                "bubble_id", "mmsi", "datetime", "latitude", "longitude",
                "fishing_hours", "vessel_class", "flag_state",
                "quality_flag", "source_system", "schema_version",
            ]
        ].to_dict("records")

        try:
            with get_raw_conn() as conn:
                cursor = conn.cursor()
                cursor.executemany(insert_sql, records)
                conn.commit()
            logger.success(f"GFW: ingested {len(records)} AIS records.")
        except Exception as exc:
            logger.error(f"GFW ingest failed: {exc}")

    # ──────────────────────────────────────────────────────────────────────────
    # Live GFW API
    # ──────────────────────────────────────────────────────────────────────────

    def _fetch_live(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        days_back: int,
    ) -> pd.DataFrame:
        """
        Calls the GFW v3 fishing effort API.
        Returns effort tiles aggregated to vessel-day records.
        """
        end_date   = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=days_back)

        headers = {"Authorization": f"Bearer {GFW_API_KEY}"}
        params  = {
            "datasets[0]": "public-fishing-effort:latest",
            "date-range":  f"{start_date},{end_date}",
            "format":      "json",
        }

        logger.info(f"GFW live fetch: {start_date} → {end_date} | bbox [{lat_min},{lon_min},{lat_max},{lon_max}]")

        try:
            resp = requests.get(
                f"{GFW_API_BASE}/datasets/public-fishing-effort/user-context-layers",
                headers=headers,
                params=params,
                timeout=30,
            )
            resp.raise_for_status()
            raw = resp.json()
        except requests.RequestException as exc:
            logger.warning(f"GFW API call failed ({exc}). Falling back to synthetic data.")
            self.last_fetch_was_live = False
            return self._generate_synthetic(lat_min, lat_max, lon_min, lon_max, days_back)

        rows = []
        for feature in raw.get("features", []):
            props = feature.get("properties", {})
            geom  = feature.get("geometry", {}).get("coordinates", [None, None])
            rows.append({
                "mmsi":           str(props.get("mmsi", "UNKNOWN")),
                "datetime":       pd.to_datetime(props.get("date", datetime.now(timezone.utc))),
                "latitude":       float(geom[1]) if geom[1] else 0.0,
                "longitude":      float(geom[0]) if geom[0] else 0.0,
                "fishing_hours":  float(props.get("apparent_fishing_hours", 0)),
                "vessel_class":   props.get("geartype", "fishing"),
                "flag_state":     props.get("flag", "XX"),
                "quality_flag":   "GOOD",
                "source_system":  self.source_system,
                "schema_version": self.schema_version,
            })

        if not rows:
            logger.warning("GFW API returned zero features for this window/bbox. Falling back to synthetic data.")
            self.last_fetch_was_live = False
            return self._generate_synthetic(lat_min, lat_max, lon_min, lon_max, days_back)

        df = pd.DataFrame(rows)
        logger.info(f"GFW live: parsed {len(df)} effort records.")

        # Run the 5-stage AIS quality pipeline
        df = self.ais_qc.process_batch(df)
        self.last_fetch_was_live = True
        return df

    # ──────────────────────────────────────────────────────────────────────────
    # Synthetic fallback
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_synthetic(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        days_back: int,
    ) -> pd.DataFrame:
        """
        Generate realistic synthetic AIS fishing effort records for the
        Indian EEZ (Arabian Sea + Bay of Bengal).

        Vessels are clustered in three high-productivity fishing grounds:
          - Gujarat / Saurashtra coast (Arabian Sea, NW India)
          - Kerala / Karnataka upwelling zone (Arabian Sea, SW India)
          - Bay of Bengal inshore zone (Andhra Pradesh / Tamil Nadu)

        Each simulated vessel makes plausible tracks over `days_back` days.
        """
        rng  = np.random.default_rng(seed=42)
        now  = datetime.now(timezone.utc)
        rows = []

        # Fishing ground centroids (lat, lon) and fleet sizes
        grounds = [
            {"name": "Gujarat-Saurashtra",  "lat": 21.5, "lon": 70.5, "n_vessels": 15},
            {"name": "Kerala-Upwelling",     "lat": 11.0, "lon": 75.5, "n_vessels": 20},
            {"name": "Bay-of-Bengal-Inshore","lat": 13.5, "lon": 81.5, "n_vessels": 12},
            {"name": "Lakshadweep-Sea",      "lat":  9.5, "lon": 73.0, "n_vessels":  8},
        ]

        vessel_classes = ["trawler", "driftnets", "set_longlines", "purse_seines"]
        flag_states    = ["IN", "IN", "IN", "IN", "LK", "MM"]  # mostly Indian

        for ground in grounds:
            for v in range(ground["n_vessels"]):
                mmsi = f"4190{rng.integers(10000, 99999)}"
                vessel_class = rng.choice(vessel_classes)
                flag         = rng.choice(flag_states)

                # Vessel starts at ground centroid ± scatter
                base_lat = ground["lat"] + rng.normal(0, 0.8)
                base_lon = ground["lon"] + rng.normal(0, 0.8)

                for d in range(days_back):
                    dt = now - timedelta(days=d, hours=int(rng.integers(0, 8)))

                    # Drift 0–5 km per day (realistic for fishing vessels)
                    dlat = rng.normal(0, 0.05)
                    dlon = rng.normal(0, 0.05)
                    lat  = float(np.clip(base_lat + dlat * d, lat_min, lat_max))
                    lon  = float(np.clip(base_lon + dlon * d, lon_min, lon_max))

                    # Fishing hours: 0 if in port / weather, else 4–16h
                    in_port = rng.random() < 0.12
                    fishing_hours = 0.0 if in_port else float(rng.uniform(4, 16))

                    rows.append({
                        "mmsi":           mmsi,
                        "datetime":       dt,
                        "latitude":       lat,
                        "longitude":      lon,
                        "fishing_hours":  round(fishing_hours, 2),
                        "vessel_class":   vessel_class,
                        "flag_state":     flag,
                        "quality_flag":   "GOOD",
                        "source_system":  self.source_system,
                        "schema_version": self.schema_version,
                    })

        df = pd.DataFrame(rows)
        logger.info(f"GFW synthetic: generated {len(df)} AIS records across {len(grounds)} fishing grounds.")

        # Run the 5-stage AIS quality pipeline even on synthetic data
        # (validates the pipeline itself and removes any edge-case duplicates)
        df = self.ais_qc.process_batch(df)
        return df
