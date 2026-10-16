import warnings
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.model import (
    PredictRequest,
    PredictResponse,
    ModelInfoResponse,
    EvaluationResponse,
    SyntheticMetricSection,
)


class MLService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self):
        """Loads model and scaler artifacts once during initialization."""
        try:
            if not settings.MODEL_PATH.exists():
                logger.warning(f"Model file not found at {settings.MODEL_PATH}")
                return
            if not settings.SCALER_PATH.exists():
                logger.warning(f"Scaler file not found at {settings.SCALER_PATH}")
                return

            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self.model = joblib.load(settings.MODEL_PATH)
                self.scaler = joblib.load(settings.SCALER_PATH)

            self.is_loaded = True
            logger.info("Isolation Forest model and StandardScaler successfully loaded.")
        except Exception as e:
            logger.error(f"Failed to load ML artifacts: {e}")
            self.is_loaded = False

    def predict(self, req: PredictRequest) -> PredictResponse:
        if not self.is_loaded or self.model is None or self.scaler is None:
            raise RuntimeError("ML model or scaler is not loaded.")

        # Check physical ranges
        if not (-50.0 <= req.temp <= 60.0):
            raise ValueError(f"Temperature {req.temp}°C is outside valid physical range (-50°C to 60°C).")
        if not (0.0 <= req.rhum <= 100.0):
            raise ValueError(f"Humidity {req.rhum}% is outside valid physical range (0% to 100%).")

        # Feature order: ["temp", "rhum", "temp_change", "humidity_change", "hour", "month"]
        imputed = {}
        
        # Temp & Rhum are required
        temp_val = float(req.temp)
        rhum_val = float(req.rhum)

        # Temp change
        if req.temp_change is not None:
            temp_change_val = float(req.temp_change)
        else:
            temp_change_val = settings.TRAINING_MEDIANS["temp_change"]
            imputed["temp_change"] = temp_change_val

        # Humidity change
        if req.humidity_change is not None:
            humidity_change_val = float(req.humidity_change)
        else:
            humidity_change_val = settings.TRAINING_MEDIANS["humidity_change"]
            imputed["humidity_change"] = humidity_change_val

        # Hour
        if req.hour is not None:
            hour_val = float(req.hour)
        else:
            hour_val = settings.TRAINING_MEDIANS["hour"]
            imputed["hour"] = hour_val

        # Month
        if req.month is not None:
            month_val = float(req.month)
        else:
            month_val = settings.TRAINING_MEDIANS["month"]
            imputed["month"] = month_val

        raw_df = pd.DataFrame([[
            temp_val,
            rhum_val,
            temp_change_val,
            humidity_change_val,
            hour_val,
            month_val,
        ]], columns=settings.FEATURES)

        scaled_vector = self.scaler.transform(raw_df)
        scaled_df = pd.DataFrame(scaled_vector, columns=settings.FEATURES)
        pred = int(self.model.predict(scaled_df)[0])
        score = float(self.model.decision_function(scaled_df)[0])

        is_anomaly = (pred == -1)
        status = "Potential Anomaly" if is_anomaly else "Normal"

        if score < -0.05:
            confidence = "High statistical divergence from baseline patterns"
        elif score < 0.0:
            confidence = "Moderate statistical divergence from typical observations"
        elif score < 0.03:
            confidence = "Marginal normal reading near decision boundary"
        else:
            confidence = "Typical normal reading well within seasonal norms"

        scaled_dict = {
            feat: round(float(scaled_vector[0][i]), 4)
            for i, feat in enumerate(settings.FEATURES)
        }

        return PredictResponse(
            prediction=pred,
            status=status,
            anomaly_score=round(score, 6),
            is_anomaly=is_anomaly,
            confidence_description=confidence,
            imputed_values=imputed,
            scaled_features=scaled_dict,
        )

    def get_model_info(self) -> ModelInfoResponse:
        means = {}
        scales = {}
        if self.scaler is not None:
            for feat, m, s in zip(settings.FEATURES, self.scaler.mean_, self.scaler.scale_):
                means[feat] = round(float(m), 4)
                scales[feat] = round(float(s), 4)

        return ModelInfoResponse(
            model_name="Isolation Forest (contamination=0.05)",
            algorithm="Isolation Forest (sklearn.ensemble.IsolationForest)",
            parameters=settings.MODEL_PARAMS,
            features=settings.FEATURES,
            training_records=6220,
            test_records=1555,
            train_period={
                "start": "2024-01-01 00:00:00",
                "end": "2024-10-01 06:00:00",
            },
            test_period={
                "start": "2024-10-01 07:00:00",
                "end": "2024-12-31 22:00:00",
            },
            scaler_type="StandardScaler (Fitted on Training Set Only)",
            scaler_means=means,
            scaler_scales=scales,
            imputation_medians=settings.TRAINING_MEDIANS,
            feature_order=settings.FEATURES,
            is_loaded=self.is_loaded,
            status="Active" if self.is_loaded else "Unavailable",
        )

    def get_evaluation_metrics(self) -> EvaluationResponse:
        score_stats = {
            "count": 1555.0,
            "mean": 0.034826,
            "std": 0.023846,
            "min": -0.085612,
            "p25": 0.020894,
            "median": 0.038972,
            "p75": 0.051078,
            "max": 0.086940,
        }

        limitations = [
            "The historical weather test dataset does not have verified ground-truth anomaly labels from human meteorologists.",
            "Real-world precision, recall, and accuracy cannot be definitively computed on unlabelled real observational data alone.",
            "Synthetic evaluation results (92.28% accuracy, 37.93% precision, 100% recall, 55% F1) reflect performance only against injected artificial anomalies under the assumption that all original rows were normal.",
            "All model outputs represent statistical abnormality relative to historical station distributions and must not be interpreted as official severe weather alerts or weather forecasts.",
        ]

        return EvaluationResponse(
            test_records=1555,
            normal_predictions=1429,
            potential_anomalies=126,
            anomaly_rate=8.10,
            score_statistics=score_stats,
            synthetic_experiment=SyntheticMetricSection(),
            limitations=limitations,
        )


ml_service = MLService()
