"""
OceanMind — Marine Health Index (Phase C)
Isolation Forest anomaly detection across multi-parameter oceanographic data.
Output: MHI score (0–100) per grid cell; lower = more stressed.
"""
import os
import json
import pickle
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
from loguru import logger

MODEL_PATH = os.path.join(os.path.dirname(__file__), "artifacts", "mhi_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "artifacts", "mhi_scaler.pkl")

# Features used for anomaly detection (ARGO CTD + INCOIS SST)
MHI_FEATURES = [
    "sst_anomaly",       # SST deviation from 5-yr mean
    "chlorophyll_dev",   # Chl-a deviation from baseline
    "dissolved_o2",      # µmol/kg
    "ph",                # ocean pH
    "salinity_psu",      # PSU
    "do_ph_compound",    # synergistic DO×pH interaction feature (compound stress)
]

ALERT_THRESHOLDS = {
    "critical": 25,   # MHI < 25 → critical stress
    "warning":  50,   # MHI < 50 → elevated stress
    "watch":    65,   # MHI < 65 → watch
}


class MarineHealthIndex:
    """Isolation Forest-based Marine Health Index."""

    def __init__(self, contamination: float = 0.08):
        self.contamination = contamination
        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[MinMaxScaler] = None
        self._trained = False

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived features; normalise column names."""
        df = df.copy()
        # Cast all numeric-like columns to float64 (psycopg3 may return Decimal/object)
        numeric_cols = ["sst_c", "chlorophyll_mgl", "dissolved_o2", "ph",
                        "salinity_psu", "latitude", "longitude", "incois_sst"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        # SST anomaly: deviation from rolling 30-day mean
        if "sst_c" in df.columns:
            rolling_mean = df["sst_c"].rolling(window=30, min_periods=1).mean()
            df["sst_anomaly"] = df["sst_c"] - rolling_mean
        else:
            df["sst_anomaly"] = 0.0

        # Chl-a deviation from log-normal baseline
        if "chlorophyll_mgl" in df.columns:
            log_chl = np.log1p(df["chlorophyll_mgl"].clip(0))
            df["chlorophyll_dev"] = log_chl - log_chl.rolling(30, min_periods=1).mean()
        else:
            df["chlorophyll_dev"] = 0.0

        # Compound stress: synergistic DO × pH
        if "dissolved_o2" in df.columns and "ph" in df.columns:
            do_norm = (df["dissolved_o2"] / 220).clip(0, 1)
            ph_norm = ((df["ph"] - 7.8) / 0.4).clip(0, 1)
            df["do_ph_compound"] = do_norm * ph_norm
        else:
            df["do_ph_compound"] = 1.0  # healthy default

        # Fallback fill
        for col in MHI_FEATURES:
            if col not in df.columns:
                df[col] = 0.0
        df[MHI_FEATURES] = df[MHI_FEATURES].fillna(df[MHI_FEATURES].median())
        return df

    def train(self, df: pd.DataFrame) -> None:
        """Train on historical oceanographic data."""
        logger.info("Training Marine Health Index model...")
        df = self._engineer_features(df)
        X = df[MHI_FEATURES].values

        self.scaler = MinMaxScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = IsolationForest(
            n_estimators=200,
            contamination=self.contamination,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X_scaled)
        self._trained = True

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        with open(SCALER_PATH, "wb") as f:
            pickle.dump(self.scaler, f)
        logger.success("MHI model trained and saved.")

    def load(self) -> bool:
        """Load pre-trained model from disk."""
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            with open(MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)
            with open(SCALER_PATH, "rb") as f:
                self.scaler = pickle.load(f)
            self._trained = True
            logger.info("MHI model loaded from disk.")
            return True
        return False

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Predict MHI score (0–100) for each row.
        Returns df with added columns: mhi_score, stress_level, alert.
        """
        if not self._trained:
            raise RuntimeError("MHI model not trained. Call train() or load() first.")

        df = self._engineer_features(df)
        X = df[MHI_FEATURES].values
        X_scaled = self.scaler.transform(X)

        # Isolation Forest decision_function: higher = more normal (healthier)
        raw_scores = self.model.decision_function(X_scaled)

        # Normalise to 0–100: raw scores are typically in [-0.5, 0.5]
        # Invert so that higher score = healthier ocean
        mhi = np.clip((raw_scores + 0.5) * 100, 0, 100)

        df = df.copy()
        df["mhi_score"] = np.round(mhi, 1)
        df["stress_level"] = df["mhi_score"].apply(self._classify_stress)
        df["alert"] = df["mhi_score"] < ALERT_THRESHOLDS["warning"]
        return df

    @staticmethod
    def _classify_stress(score: float) -> str:
        if score < ALERT_THRESHOLDS["critical"]:
            return "CRITICAL"
        if score < ALERT_THRESHOLDS["warning"]:
            return "WARNING"
        if score < ALERT_THRESHOLDS["watch"]:
            return "WATCH"
        return "NORMAL"

    def score_from_dict(self, params: dict) -> dict:
        """
        Score a single observation dict.
        Useful for the API endpoint without requiring full DataFrame.
        """
        df = pd.DataFrame([params])
        result = self.predict(df)
        row = result.iloc[0]
        return {
            "mhi_score": float(row["mhi_score"]),
            "stress_level": row["stress_level"],
            "alert": bool(row["alert"]),
            "features_used": MHI_FEATURES,
            "thresholds": ALERT_THRESHOLDS,
        }


def train_from_db(conn) -> MarineHealthIndex:
    """
    Pull data from PostGIS and train the MHI model.
    Joins argo_profiles + incois_sst via bubble_id.
    """
    query = """
        SELECT
            a.temperature_c   AS sst_c,
            s.chlorophyll_mgl,
            a.dissolved_o2,
            a.ph,
            a.salinity_psu,
            s.sst_c           AS incois_sst
        FROM argo_profiles a
        LEFT JOIN data_bubbles  b ON a.bubble_id  = b.bubble_id
        LEFT JOIN incois_sst    s ON s.bubble_id  = b.bubble_id
        WHERE a.quality_flag IN ('GOOD', 'PROBABLY_GOOD')
        LIMIT 5000;
    """
    df = pd.read_sql(query, conn)
    if df.empty:
        logger.warning("No training data found — generating synthetic data for MHI.")
        df = _synthetic_mhi_data(n=2000)
    else:
        # Fill cross-table nulls from LEFT JOIN (ARGO doesn't measure Chl)
        df = df.fillna({
            "chlorophyll_mgl": 0.3,
            "dissolved_o2": 200.0,
            "ph": 8.1,
            "salinity_psu": 34.5,
            "incois_sst": df.get("sst_c", pd.Series([28.0])).median(),
        })
        df["chlorophyll_mgl"] = df["chlorophyll_mgl"].clip(lower=0.001)
    mhi = MarineHealthIndex()
    mhi.train(df)
    return mhi


def _synthetic_mhi_data(n: int = 2000) -> pd.DataFrame:
    """Synthetic training data when DB is empty (demo mode)."""
    np.random.seed(42)
    # 90% healthy, 10% stressed
    n_healthy = int(n * 0.9)
    n_stressed = n - n_healthy
    healthy = pd.DataFrame({
        "sst_c":           np.random.normal(28, 1.5, n_healthy),
        "chlorophyll_mgl": np.random.lognormal(-1.2, 0.5, n_healthy),
        "dissolved_o2":    np.random.normal(200, 15, n_healthy),
        "ph":              np.random.normal(8.1, 0.03, n_healthy),
        "salinity_psu":    np.random.normal(34.5, 0.4, n_healthy),
    })
    stressed = pd.DataFrame({
        "sst_c":           np.random.normal(31, 2.0, n_stressed),   # elevated SST
        "chlorophyll_mgl": np.random.lognormal(-2.5, 0.3, n_stressed),  # depleted Chl
        "dissolved_o2":    np.random.normal(120, 30, n_stressed),   # hypoxic
        "ph":              np.random.normal(7.9, 0.05, n_stressed),  # acidified
        "salinity_psu":    np.random.normal(35.5, 0.8, n_stressed),
    })
    return pd.concat([healthy, stressed], ignore_index=True)
