from typing import Optional
from fastapi import APIRouter, Query
from backend.app.schemas.weather import WeatherFilterParams
from backend.app.schemas.anomaly import (
    PaginatedAnomalyResponse,
    AnomalyAnalyticsResponse,
)
from backend.app.services.weather_service import weather_service

router = APIRouter(tags=["Anomaly Detection"])


@router.get("/anomalies", response_model=PaginatedAnomalyResponse)
def get_anomalies(
    start_date: Optional[str] = Query(None, description="Filter starting at date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter ending at date (YYYY-MM-DD)"),
    min_temp: Optional[float] = Query(None, description="Minimum temperature (°C)"),
    max_temp: Optional[float] = Query(None, description="Maximum temperature (°C)"),
    search: Optional[str] = Query(None, description="Search keyword in timestamp or status"),
    sort_by: str = Query("anomaly_score", description="Sort field (anomaly_score, time, temp, rhum)"),
    sort_dir: str = Query("asc", description="Sort order: 'asc' puts lowest (most anomalous) score first"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page"),
):
    """Retrieve filtered and sorted records identified as Potential Anomalies by the model."""
    params = WeatherFilterParams(
        start_date=start_date,
        end_date=end_date,
        min_temp=min_temp,
        max_temp=max_temp,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        limit=limit,
    )
    return weather_service.get_anomalies(params)


@router.get("/analytics", response_model=AnomalyAnalyticsResponse)
def get_anomaly_analytics():
    """Retrieve anomaly score distributions, monthly/hourly rates, and severity metrics."""
    return weather_service.get_analytics()
