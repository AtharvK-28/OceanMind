"""
OceanMind — INCOIS Data Ingestion Pipeline (Phase A)
Fetches INCOIS SST composites and chlorophyll data.
"""
from datetime import datetime, timezone, date
import pandas as pd
import numpy as np
from loguru import logger
from backend.db.connection import get_raw_conn

class IncoisPipeline:
    def __init__(self):
        self.source_system = "INCOIS"
        self.schema_version = "1.0"

    def fetch_recent_composites(self) -> pd.DataFrame:
        """
        Fetches recent INCOIS SST composites.
        For MVP fallback demo, generates synthetic gridded data.
        """
        logger.info("Fetching recent INCOIS composites...")
        
        # Synthetic mock grid
        now = date.today()
        data = []
        # small sample grid
        for lat in np.arange(10, 15, 1.0):
            for lon in np.arange(70, 75, 1.0):
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
                
        logger.info(f"Generated {len(data)} INCOIS grid points.")
        return pd.DataFrame(data)

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
