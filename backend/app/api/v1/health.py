from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.services.ml_service import ml_service
from backend.app.services.weather_service import weather_service

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "model_loaded": ml_service.is_loaded,
        "records_loaded": len(weather_service.df) if weather_service._df is not None else 0,
    }
