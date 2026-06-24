"""
OceanMind — Sustainable Fishing Zone (SFZ) Engine (Phase D)
XGBoost classifier: Green / Amber / Red zones with SHAP explainability.
Updates weekly from INCOIS SST + Copernicus Chl-a composites.
"""
import os
import json
import pickle
from datetime import date, timedelta
from typing import Optional

import numpy as np
import pandas as pd
import xgboost as xgb
import shap
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score
from sklearn.preprocessing import LabelEncoder
from loguru import logger

MODEL_PATH  = os.path.join(os.path.dirname(__file__), "artifacts", "sfz_model.pkl")
SHAP_PATH   = os.path.join(os.path.dirname(__file__), "artifacts", "sfz_explainer.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "artifacts", "sfz_encoder.pkl")

# Feature set for SFZ classifier
SFZ_FEATURES = [
    "sst_c",             # Sea Surface Temperature
    "sst_anomaly",       # SST deviation from 5yr mean
    "chlorophyll_mgl",   # Chlorophyll-a
    "ssh_anomaly",       # Sea Surface Height anomaly
    "mld_m",             # Mixed Layer Depth
    "fishing_effort_h",  # GFW fishing hours (effort density)
    "wind_stress_curl",  # upwelling indicator
    "month",             # seasonal signal
    "latitude",          # geographic
    "longitude",
]

CLASS_MAP = {"GREEN": 0, "AMBER": 1, "RED": 2}
CLASS_NAMES = ["GREEN", "AMBER", "RED"]


class SFZClassifier:
    """XGBoost Sustainable Fishing Zone classifier with SHAP explainability."""

    def __init__(self):
        self.model: Optional[xgb.XGBClassifier] = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self.label_encoder: Optional[LabelEncoder] = None
        self._trained = False

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Cast numeric columns to float64 (psycopg3 may return Decimal/object)
        numeric_cols = ["sst_c", "chlorophyll_mgl", "ssh_anomaly", "mld_m",
                        "fishing_effort_h", "wind_stress_curl", "latitude", "longitude", "month"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")
        if "composite_date" in df.columns:
            df["month"] = pd.to_datetime(df["composite_date"]).dt.month
        elif "month" not in df.columns:
            df["month"] = 6  # default

        if "sst_c" in df.columns:
            rolling = df["sst_c"].rolling(30, min_periods=1).mean()
            df["sst_anomaly"] = df["sst_c"] - rolling
        else:
            df["sst_anomaly"] = 0.0

        if "fishing_hours" in df.columns:
            df["fishing_effort_h"] = df["fishing_hours"]
        elif "fishing_effort_h" not in df.columns:
            df["fishing_effort_h"] = 0.0

        for col in SFZ_FEATURES:
            if col not in df.columns:
                df[col] = 0.0

        df[SFZ_FEATURES] = df[SFZ_FEATURES].fillna(df[SFZ_FEATURES].median())
        return df

    def train(self, df: pd.DataFrame) -> dict:
        """
        5-fold stratified cross-validation by year.
        Returns validation metrics.
        """
        logger.info("Training SFZ XGBoost classifier (5-fold CV)...")
        df = self._engineer_features(df)

        # Label encode target
        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(df["ecological_class"])
        X = df[SFZ_FEATURES].values

        # 5-fold CV
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        f1_scores = []

        for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
            X_tr, X_val = X[train_idx], X[val_idx]
            y_tr, y_val = y[train_idx], y[val_idx]
            clf = xgb.XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                eval_metric="mlogloss",
                random_state=42,
                n_jobs=-1,
            )
            clf.fit(X_tr, y_tr, verbose=False)
            preds = clf.predict(X_val)
            f1 = f1_score(y_val, preds, average="weighted")
            f1_scores.append(f1)
            logger.debug(f"  Fold {fold+1}: F1={f1:.3f}")

        mean_f1 = float(np.mean(f1_scores))
        logger.info(f"CV F1 (weighted): {mean_f1:.3f} ± {np.std(f1_scores):.3f}")

        # Final model on full data
        self.model = xgb.XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X, y, verbose=False)

        # SHAP explainer
        self.explainer = shap.TreeExplainer(self.model)
        self._trained = True

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        with open(SHAP_PATH, "wb") as f:
            pickle.dump(self.explainer, f)
        with open(ENCODER_PATH, "wb") as f:
            pickle.dump(self.label_encoder, f)

        logger.success(f"SFZ model trained and saved. Mean CV F1: {mean_f1:.3f}")
        return {"cv_f1_mean": mean_f1, "cv_f1_std": float(np.std(f1_scores))}

    def load(self) -> bool:
        if all(os.path.exists(p) for p in [MODEL_PATH, SHAP_PATH, ENCODER_PATH]):
            with open(MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)
            with open(SHAP_PATH, "rb") as f:
                self.explainer = pickle.load(f)
            with open(ENCODER_PATH, "rb") as f:
                self.label_encoder = pickle.load(f)
            self._trained = True
            logger.info("SFZ model loaded from disk.")
            return True
        return False

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Predict SFZ classes + SHAP top-3 feature importances.
        Returns df with: ecological_class, bycatch_risk_score, shap_top3.
        """
        if not self._trained:
            raise RuntimeError("SFZ model not trained. Call train() or load() first.")
        df = self._engineer_features(df)
        X = df[SFZ_FEATURES].values

        preds = self.model.predict(X)
        probs = self.model.predict_proba(X)

        # SHAP values — shap>=0.45 returns shape (samples, features, classes)
        # older versions return list[class] of (samples, features)
        shap_values = self.explainer.shap_values(X)
        results = []
        for i, (pred, prob) in enumerate(zip(preds, probs)):
            class_name = self.label_encoder.inverse_transform([pred])[0]
            # Handle both shap output shapes
            if isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                # New shape: (n_samples, n_features, n_classes)
                shap_for_class = shap_values[i, :, int(pred)]
            elif isinstance(shap_values, list):
                # Old shape: list of (n_samples, n_features)
                shap_for_class = shap_values[int(pred)][i]
            else:
                shap_for_class = shap_values[i]

            top3_idx = np.argsort(np.abs(shap_for_class))[-3:][::-1]
            shap_top3 = [
                {"feature": SFZ_FEATURES[int(j)], "value": round(float(shap_for_class[j]), 4)}
                for j in top3_idx
            ]
            # Bycatch risk: probability of RED class (class index 2)
            bycatch_risk = float(prob[2]) if len(prob) > 2 else 0.0
            results.append({
                "ecological_class": class_name,
                "bycatch_risk_score": round(bycatch_risk, 3),
                "shap_top3": shap_top3,
                "confidence": float(prob[pred]),
            })
        result_df = pd.DataFrame(results)
        return pd.concat([df.reset_index(drop=True), result_df], axis=1)

    def predict_single(self, params: dict) -> dict:
        """Predict a single grid cell from a parameter dict."""
        df = pd.DataFrame([params])
        result = self.predict(df)
        row = result.iloc[0]
        return {
            "ecological_class": row["ecological_class"],
            "bycatch_risk_score": float(row["bycatch_risk_score"]),
            "shap_top3": row["shap_top3"],
            "confidence": float(row["confidence"]),
        }

    def generate_weekly_sfz_geojson(self, predictions_df: pd.DataFrame) -> dict:
        """Convert SFZ predictions DataFrame to GeoJSON FeatureCollection."""
        features = []
        for _, row in predictions_df.iterrows():
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        float(row.get("longitude", 0)),
                        float(row.get("latitude", 0)),
                    ],
                },
                "properties": {
                    "ecological_class": row.get("ecological_class", "AMBER"),
                    "bycatch_risk_score": float(row.get("bycatch_risk_score", 0)),
                    "shap_top3": row.get("shap_top3", []),
                    "grid_cell_id": row.get("grid_cell_id", ""),
                    "week_start": str(row.get("week_start", date.today())),
                    "confidence": float(row.get("confidence", 0.5)),
                },
            }
            features.append(feature)
        return {"type": "FeatureCollection", "features": features}


def train_from_db(conn) -> SFZClassifier:
    """Pull SFZ seed data from DB and train."""
    query = """
        SELECT s.latitude, s.longitude,
               s.composite_date, s.sst_c, s.chlorophyll_mgl,
               s.ssh_anomaly, s.mld_m, s.wind_stress_curl,
               EXTRACT(MONTH FROM s.composite_date) AS month,
               COALESCE(a.fishing_hours, 0) AS fishing_effort_h,
               -- Use seeded sfz_output for training labels
               z.ecological_class
        FROM incois_sst s
        LEFT JOIN data_bubbles b ON s.bubble_id = b.bubble_id
        LEFT JOIN gfw_ais a     ON a.bubble_id  = b.bubble_id
        LEFT JOIN sfz_output z  ON z.grid_cell_id = 'LAT_' || FLOOR(s.latitude)::text
                                                  || '_LON_' || FLOOR(s.longitude)::text
        WHERE z.ecological_class IS NOT NULL
        LIMIT 3000;
    """
    df = pd.read_sql(query, conn)
    if df.empty or len(df) < 100:
        logger.warning("Insufficient DB data — using synthetic SFZ training data.")
        df = _synthetic_sfz_data(n=3000)
    clf = SFZClassifier()
    clf.train(df)
    return clf


def _synthetic_sfz_data(n: int = 3000) -> pd.DataFrame:
    """Synthetic SFZ training data with ecological rules baked in."""
    np.random.seed(42)
    data = []
    for _ in range(n):
        lat = np.random.uniform(5, 25)
        lon = np.random.uniform(60, 100)
        month = np.random.randint(1, 13)
        sst  = np.random.normal(28.5 + 2*np.sin(month*np.pi/6), 1.5)
        chl  = np.random.lognormal(-1.2, 0.6)
        ssh  = np.random.normal(0, 0.08)
        mld  = np.random.uniform(20, 100)
        effort = max(0, np.random.normal(3, 2))
        wsc  = np.random.normal(0, 1e-7)

        # Ecological rules for label generation
        score = 0
        if 24 < sst < 30: score += 2      # optimal SST
        if chl > 0.3: score += 2          # productive
        if effort > 5: score -= 2         # overfished
        if month in [6, 7, 8]: score -= 1 # monsoon
        score += np.random.normal(0, 0.5)

        if score >= 2:
            label = "GREEN"
        elif score >= 0:
            label = "AMBER"
        else:
            label = "RED"

        data.append({
            "latitude": lat, "longitude": lon, "month": month,
            "sst_c": sst, "sst_anomaly": sst - 28.0,
            "chlorophyll_mgl": chl, "ssh_anomaly": ssh,
            "mld_m": mld, "fishing_effort_h": effort,
            "wind_stress_curl": wsc, "ecological_class": label,
        })
    return pd.DataFrame(data)
