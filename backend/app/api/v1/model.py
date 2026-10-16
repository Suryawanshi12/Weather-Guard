from fastapi import APIRouter, HTTPException
from backend.app.schemas.model import (
    PredictRequest,
    PredictResponse,
    ModelInfoResponse,
    EvaluationResponse,
)
from backend.app.services.ml_service import ml_service

router = APIRouter(tags=["Model & Inference"])


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_information():
    """Retrieve Isolation Forest architecture parameters, preprocessing specs, and feature ordering."""
    return ml_service.get_model_info()


@router.get("/evaluation", response_model=EvaluationResponse)
def get_model_evaluation():
    """Retrieve test set prediction summary, synthetic experiment metrics, and limitation notes."""
    return ml_service.get_evaluation_metrics()


@router.post("/predict", response_model=PredictResponse)
def predict_weather_anomaly(request: PredictRequest):
    """
    Perform real-time anomaly detection inference using the fitted Isolation Forest model.
    Validates physical temperature and humidity bounds, applies training medians for missing values,
    scales using the exact fitted StandardScaler, and returns decision score and status.
    """
    try:
        return ml_service.predict(request)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred during model inference.")
