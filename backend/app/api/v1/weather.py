from typing import Optional
from fastapi import APIRouter, Query, Response
from backend.app.schemas.weather import (
    WeatherFilterParams,
    PaginatedWeatherResponse,
    WeatherSummaryResponse,
)
from backend.app.services.weather_service import weather_service

router = APIRouter(tags=["Weather Monitoring"])


@router.get("/summary", response_model=WeatherSummaryResponse)
def get_weather_summary(
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
):
    """Retrieve statistical summary of weather records and anomaly metrics."""
    return weather_service.get_summary(start_date=start_date, end_date=end_date)


@router.get("/weather", response_model=PaginatedWeatherResponse)
def get_weather_records(
    start_date: Optional[str] = Query(None, description="Filter records starting at this timestamp/date"),
    end_date: Optional[str] = Query(None, description="Filter records ending at this timestamp/date"),
    status: Optional[str] = Query(None, description="Filter by status ('Normal', 'Potential Anomaly', 'all')"),
    min_temp: Optional[float] = Query(None, description="Minimum temperature (°C)"),
    max_temp: Optional[float] = Query(None, description="Maximum temperature (°C)"),
    search: Optional[str] = Query(None, description="Keyword search in time or status"),
    sort_by: str = Query("time", description="Column to sort by (time, temp, rhum, anomaly_score)"),
    sort_dir: str = Query("asc", description="Sort direction ('asc' or 'desc')"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page"),
):
    """Searchable, filterable, and paginated list of weather records with anomaly predictions."""
    params = WeatherFilterParams(
        start_date=start_date,
        end_date=end_date,
        status=status,
        min_temp=min_temp,
        max_temp=max_temp,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        limit=limit,
    )
    return weather_service.get_weather_records(params)


@router.get("/weather/export")
def export_weather_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_temp: Optional[float] = Query(None),
    max_temp: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("time"),
    sort_dir: str = Query("asc"),
):
    """Export the currently filtered weather records to a downloadable CSV file."""
    params = WeatherFilterParams(
        start_date=start_date,
        end_date=end_date,
        status=status,
        min_temp=min_temp,
        max_temp=max_temp,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=1,
        limit=50000,
    )
    csv_content, filename = weather_service.export_filtered_csv(params)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
