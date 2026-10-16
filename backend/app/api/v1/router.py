from fastapi import APIRouter
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.weather import router as weather_router
from backend.app.api.v1.anomalies import router as anomalies_router
from backend.app.api.v1.model import router as model_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.live import router as live_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(weather_router)
api_router.include_router(anomalies_router)
api_router.include_router(model_router)
api_router.include_router(reports_router)
api_router.include_router(live_router)

