"""
OceanMind — INCOIS Data Ingestion Pipeline (Phase A)

Fetches sea surface temperature and chlorophyll-a for a grid over the
Indian coastal shelf:

  - SST: live via Open-Meteo Marine API (free, no key). Goes live whenever
    FALLBACK_DATA_MODE=false — same convention as the ARGO/GFW pipelines.
  - Chlorophyll-a: live via Copernicus Marine Service (CMEMS), which needs
    a free account (register at https://data.marine.copernicus.eu) and the
    `copernicusmarine` package. Set COPERNICUSMARINE_USERNAME/PASSWORD in
    .env to enable it — without credentials, chlorophyll falls back to an
    estimate even when SST is live.

  Note: INCOIS's own public ERDDAP (erddap.incois.gov.in) is real and
  reachable with no key, but its SST/chlorophyll datasets are archival
  (SST ends 2010, chlorophyll ends 2006) — not usable as a "current
  conditions" source, which is why this pipeline uses Open-Meteo + CMEMS
  instead. See backend/ingestion/README or project notes for detail.

ssh_anomaly, mld_m, wind_stress_curl, and pfz_advisory have no free/no-key
live source wired up yet and remain synthetic estimates — a Phase 2 item,
not silently presented as real.
"""

import os
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import numpy as np
import pandas as pd
import requests
from loguru import logger

from backend.db.connection import get_raw_conn

FALLBACK_MODE = os.getenv("FALLBACK_DATA_MODE", "true").lower() == "true"
CMEMS_USERNAME = os.getenv("COPERNICUSMARINE_USERNAME", "")
CMEMS_PASSWORD = os.getenv("COPERNICUSMARINE_PASSWORD", "")
CMEMS_CHL_DATASET_ID = os.getenv(
    "CMEMS_CHLOROPHYLL_DATASET_ID",
    "cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D",
)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

# CMEMS's own dataset-open overhead is ~60-70s regardless of grid size, and
# the underlying satellite product only updates once a day — so the live
# chlorophyll grid is cached for CHL_CACHE_TTL_SECONDS instead of refetched
# on every request. SST changes faster (hourly model output) so it gets a
# shorter TTL, mainly to avoid hammering Open-Meteo on repeated requests.
CHL_CACHE_TTL_SECONDS = int(os.getenv("CMEMS_CACHE_TTL_SECONDS", 3600))
SST_CACHE_TTL_SECONDS = int(os.getenv("OPEN_METEO_CACHE_TTL_SECONDS", 900))

_sst_cache: dict[tuple, tuple[float, dict]] = {}   # key -> (expires_at, by_point)
_chl_cache: dict[tuple, tuple[float, dict]] = {}   # key -> (expires_at, by_point)


def _cache_get(cache: dict, key: tuple):
    entry = cache.get(key)
    if entry and entry[0] > time.time():
        return entry[1]
    return None


def _cache_set(cache: dict, key: tuple, value: dict, ttl_seconds: int):
    cache[key] = (time.time() + ttl_seconds, value)


class IncoisPipeline:
    def __init__(self):
        self.source_system = "INCOIS"
        self.schema_version = "1.0"
        self.last_fetch_was_live = {"sst": False, "chlorophyll": False}

    def fetch_recent_composites(
        self,
        lat_min: float = 10.0,
        lat_max: float = 15.0,
        lon_min: float = 70.0,
        lon_max: float = 75.0,
        grid_step: float = 1.0,
    ) -> pd.DataFrame:
        """
        Fetches an SST + chlorophyll grid over the given bbox.
        Live: Open-Meteo (SST) + CMEMS (chlorophyll, if credentials set).
        Fallback: synthetic grid matching the same schema.
        """
        grid_points = [
            (round(float(lat), 4), round(float(lon), 4))
            for lat in np.arange(lat_min, lat_max, grid_step)
            for lon in np.arange(lon_min, lon_max, grid_step)
        ]

        if FALLBACK_MODE:
            logger.info("INCOIS: FALLBACK_DATA_MODE=true, using synthetic SST/chlorophyll grid (set to 'false' for live data).")
            self.last_fetch_was_live = {"sst": False, "chlorophyll": False}
            return self._generate_synthetic(grid_points)

        sst_by_point = self._fetch_live_sst(grid_points)
        self.last_fetch_was_live["sst"] = sst_by_point is not None

        chl_by_point = None
        if CMEMS_USERNAME and CMEMS_PASSWORD:
            chl_by_point = self._fetch_live_chlorophyll(grid_points)
        else:
            logger.info("INCOIS: no CMEMS credentials set (COPERNICUSMARINE_USERNAME/PASSWORD), chlorophyll stays estimated.")
        self.last_fetch_was_live["chlorophyll"] = chl_by_point is not None

        now = date.today()
        data = []
        for lat, lon in grid_points:
            sst = sst_by_point.get((lat, lon)) if sst_by_point else None
            chl = chl_by_point.get((lat, lon)) if chl_by_point else None
            data.append({
                "composite_date": now,
                "latitude": lat,
                "longitude": lon,
                "sst_c": sst if sst is not None else float(np.random.normal(28.5, 1.5)),
                "chlorophyll_mgl": chl if chl is not None else max(0.01, float(np.random.lognormal(-1.2, 0.4))),
                "pfz_advisory": None,                          # no free live PFZ advisory source wired up
                "ssh_anomaly": float(np.random.normal(0, 0.1)),       # no free live altimetry source wired up
                "mld_m": float(np.random.uniform(20, 80)),            # no free live MLD source wired up
                "wind_stress_curl": float(np.random.normal(0, 1e-7)), # no free live source wired up
                "quality_flag": "GOOD" if (sst is not None or chl is not None) else "ESTIMATED",
                "source_system": self.source_system,
                "schema_version": self.schema_version,
            })

        df = pd.DataFrame(data)
        logger.info(
            f"INCOIS: {len(df)} grid points | SST live={self.last_fetch_was_live['sst']} "
            f"| Chlorophyll live={self.last_fetch_was_live['chlorophyll']}"
        )
        return df

    def ingest_to_db(self, df: pd.DataFrame):
        """
        Ingests processed INCOIS data to the database.
        Note: Bubble assignment should happen before this step.
        """
        if df.empty:
            return

        logger.info("Ingesting INCOIS composites to DB...")

        insert_sql = """
            INSERT INTO incois_sst (
                bubble_id, composite_date, latitude, longitude,
                sst_c, chlorophyll_mgl, pfz_advisory, ssh_anomaly, mld_m,
                wind_stress_curl, quality_flag, source_system, schema_version
            ) VALUES (
                %(bubble_id)s, %(composite_date)s, %(latitude)s, %(longitude)s,
                %(sst_c)s, %(chlorophyll_mgl)s, %(pfz_advisory)s, %(ssh_anomaly)s, %(mld_m)s,
                %(wind_stress_curl)s, %(quality_flag)s, %(source_system)s, %(schema_version)s
            )
        """

        records = df.to_dict('records')

        try:
            with get_raw_conn() as conn:
                cursor = conn.cursor()
                cursor.executemany(insert_sql, records)
                conn.commit()
            logger.success(f"Successfully ingested {len(records)} INCOIS records.")
        except Exception as e:
            logger.error(f"Failed to ingest INCOIS data: {e}")

    # ──────────────────────────────────────────────────────────────────────────
    # Live SST via Open-Meteo (free, no key)
    # ──────────────────────────────────────────────────────────────────────────

    def _fetch_live_sst(self, grid_points):
        cache_key = tuple(sorted(grid_points))
        cached = _cache_get(_sst_cache, cache_key)
        if cached is not None:
            logger.info(f"INCOIS: SST served from cache ({len(cached)} points, TTL {SST_CACHE_TTL_SECONDS}s).")
            return cached

        def fetch_one(pt):
            lat, lon = pt
            try:
                resp = requests.get(
                    OPEN_METEO_MARINE_URL,
                    params={
                        "latitude": lat, "longitude": lon,
                        "hourly": "sea_surface_temperature",
                        "forecast_days": 1,
                    },
                    timeout=15,
                )
                resp.raise_for_status()
                hourly = resp.json().get("hourly", {})
                vals = [v for v in hourly.get("sea_surface_temperature", []) if v is not None]
                return pt, (vals[-1] if vals else None)
            except Exception as exc:
                logger.warning(f"INCOIS SST fetch failed for {pt}: {exc}")
                return pt, None

        try:
            with ThreadPoolExecutor(max_workers=8) as pool:
                results = list(pool.map(fetch_one, grid_points))
        except Exception as exc:
            logger.warning(f"INCOIS: SST grid fetch failed entirely ({exc}).")
            return None

        by_point = {pt: v for pt, v in results if v is not None}
        if not by_point:
            return None
        logger.success(f"INCOIS: live SST fetched for {len(by_point)}/{len(grid_points)} grid points (Open-Meteo).")
        _cache_set(_sst_cache, cache_key, by_point, SST_CACHE_TTL_SECONDS)
        return by_point

    # ──────────────────────────────────────────────────────────────────────────
    # Live chlorophyll-a via Copernicus Marine (free account required)
    # ──────────────────────────────────────────────────────────────────────────

    def _fetch_live_chlorophyll(self, grid_points):
        cache_key = tuple(sorted(grid_points))
        cached = _cache_get(_chl_cache, cache_key)
        if cached is not None:
            logger.info(f"INCOIS: chlorophyll served from cache ({len(cached)} points, TTL {CHL_CACHE_TTL_SECONDS}s).")
            return cached

        try:
            import copernicusmarine
        except ImportError:
            logger.warning("INCOIS: `copernicusmarine` not installed (pip install copernicusmarine); chlorophyll stays estimated.")
            return None

        lats = [p[0] for p in grid_points]
        lons = [p[1] for p in grid_points]

        try:
            ds = copernicusmarine.open_dataset(
                dataset_id=CMEMS_CHL_DATASET_ID,
                username=CMEMS_USERNAME,
                password=CMEMS_PASSWORD,
                minimum_longitude=min(lons), maximum_longitude=max(lons),
                minimum_latitude=min(lats), maximum_latitude=max(lats),
                variables=["CHL"],
            )
            latest = ds.sortby("time").isel(time=-1)

            by_point = {}
            for lat, lon in grid_points:
                try:
                    val = float(latest["CHL"].sel(latitude=lat, longitude=lon, method="nearest").values)
                    if np.isfinite(val):
                        by_point[(lat, lon)] = val
                except Exception:
                    continue

            if not by_point:
                return None
            logger.success(f"INCOIS: live chlorophyll fetched for {len(by_point)}/{len(grid_points)} grid points (CMEMS).")
            _cache_set(_chl_cache, cache_key, by_point, CHL_CACHE_TTL_SECONDS)
            return by_point
        except Exception as exc:
            logger.warning(
                f"INCOIS: CMEMS chlorophyll fetch failed ({exc}). Falling back to estimate. "
                f"Verify CMEMS_CHLOROPHYLL_DATASET_ID='{CMEMS_CHL_DATASET_ID}' and credentials."
            )
            return None

    # ──────────────────────────────────────────────────────────────────────────
    # Synthetic fallback
    # ──────────────────────────────────────────────────────────────────────────

    def _generate_synthetic(self, grid_points) -> pd.DataFrame:
        now = date.today()
        data = []
        for lat, lon in grid_points:
            data.append({
                "composite_date": now,
                "latitude": lat,
                "longitude": lon,
                "sst_c": np.random.normal(28.5, 1.5),
                "chlorophyll_mgl": max(0.01, np.random.lognormal(-1.2, 0.4)),
                "pfz_advisory": "High potential" if np.random.rand() > 0.8 else None,
                "ssh_anomaly": np.random.normal(0, 0.1),
                "mld_m": np.random.uniform(20, 80),
                "wind_stress_curl": np.random.normal(0, 1e-7),
                "quality_flag": "GOOD",
                "source_system": self.source_system,
                "schema_version": self.schema_version,
            })

        logger.info(f"INCOIS synthetic: generated {len(data)} grid points.")
        return pd.DataFrame(data)
