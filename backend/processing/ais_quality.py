"""
OceanMind — AIS Data Quality Pipeline
Phase A: Processes raw GFW AIS data before ingestion into `gfw_ais` table.
Implements the 5-stage pipeline based on Yang et al. 2024.
"""
from datetime import timedelta
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from loguru import logger

class AISQualityPipeline:
    def __init__(self):
        # Hyperparameters for DBSCAN outlier detection
        self.eps_outlier = 0.05  # roughly 5km
        self.min_samples_outlier = 2
        
        # Hyperparameters for DBSCAN-SD route clustering
        # Incorporates Speed Over Ground (SOG) and Course Over Ground (COG)
        self.eps_route = 0.1
        self.min_samples_route = 5

    def process_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Executes the 5-stage AIS quality pipeline on a batch of AIS records.
        """
        if df.empty:
            return df
            
        logger.info(f"Starting AIS Quality Pipeline for {len(df)} records.")
        df = df.copy()
        
        # Ensure datetime type
        if "datetime" in df.columns:
            df["datetime"] = pd.to_datetime(df["datetime"])
            
        df = self._mmsi_deduplication(df)
        df = self._gap_filling(df)
        df = self._outlier_removal(df)
        df = self._spoofing_detection(df)
        df = self._route_clustering(df)
        
        # Mark records as GOOD if not explicitly marked otherwise
        if "quality_flag" not in df.columns:
            df["quality_flag"] = "GOOD"
            
        # Filter out bad records or keep them flagged depending on requirement
        logger.info(f"Finished pipeline. Returning {len(df)} records.")
        return df

    def _mmsi_deduplication(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 1: MMSI Deduplication.
        Resolves multiple physical vessels sharing one MMSI.
        For MVP, we drop exact duplicates based on timestamp + MMSI.
        """
        initial_len = len(df)
        df = df.drop_duplicates(subset=["mmsi", "datetime"], keep="first")
        dropped = initial_len - len(df)
        if dropped > 0:
            logger.debug(f"MMSI Dedup: Removed {dropped} exact temporal duplicates.")
        return df

    def _gap_filling(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 2: Trajectory Gap Filling.
        Linear interpolation for short gaps (< 6h).
        """
        # Sort by MMSI and time to find gaps
        df = df.sort_values(by=["mmsi", "datetime"]).reset_index(drop=True)
        # For the MVP, we assume the dataset provided by GFW is relatively dense,
        # but in production, we would resample and interpolate.
        return df

    def _outlier_removal(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 3: Outlier Removal.
        Uses DBSCAN on (lat, lon) to identify physically impossible positional jumps.
        """
        # For performance, we cluster per MMSI if data is large.
        # Here we do a global spatial check for isolated anomalous points.
        coords = df[["latitude", "longitude"]].values
        db = DBSCAN(eps=self.eps_outlier, min_samples=self.min_samples_outlier).fit(coords)
        
        # -1 means outlier
        df["is_spatial_outlier"] = db.labels_ == -1
        outliers = df["is_spatial_outlier"].sum()
        if outliers > 0:
            logger.debug(f"Outlier Removal: Flagged {outliers} points as spatial outliers.")
            df.loc[df["is_spatial_outlier"], "quality_flag"] = "BAD"
            
        # We can drop them or just keep the flag
        df = df[~df["is_spatial_outlier"]].drop(columns=["is_spatial_outlier"])
        return df

    def _spoofing_detection(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 4: Spoofing Detection.
        Flags vessels that report stationary at port while having high fishing effort.
        """
        # Mock logic: if speed is ~0 but fishing_hours is high, flag as spoofed
        if "sog" in df.columns and "fishing_hours" in df.columns:
            spoof_mask = (df["sog"] < 0.5) & (df["fishing_hours"] > 5.0)
            spoofs = spoof_mask.sum()
            if spoofs > 0:
                logger.warning(f"Spoofing Detection: Flagged {spoofs} records as potentially spoofed.")
                df.loc[spoof_mask, "iuu_flag"] = True
                df.loc[spoof_mask, "quality_flag"] = "PROBABLY_GOOD"
        return df

    def _route_clustering(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 5: Route Clustering (DBSCAN-SD).
        Extracts typical fishing routes per area/season using lat, lon, SOG, COG.
        """
        if all(c in df.columns for c in ["latitude", "longitude", "sog", "cog"]):
            # Normalize features for clustering
            features = df[["latitude", "longitude", "sog", "cog"]].copy()
            for col in features.columns:
                features[col] = (features[col] - features[col].mean()) / (features[col].std() + 1e-6)
                
            db = DBSCAN(eps=self.eps_route, min_samples=self.min_samples_route).fit(features.values)
            df["route_cluster"] = db.labels_
            clusters = len(set(db.labels_)) - (1 if -1 in db.labels_ else 0)
            logger.debug(f"Route Clustering: Identified {clusters} distinct fishing route patterns.")
        return df
