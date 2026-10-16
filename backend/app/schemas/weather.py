from typing import Optional, List
from pydantic import BaseModel, Field


class WeatherRecord(BaseModel):
    time: str
    station: Optional[int] = None
    temp: Optional[float] = Field(None, description="Temperature in degrees Celsius")
    rhum: Optional[float] = Field(None, description="Relative humidity in percentage")
    temp_change: Optional[float] = Field(None, description="Change in temperature from prior record (°C)")
    humidity_change: Optional[float] = Field(None, description="Change in humidity from prior record (%)")
    hour: Optional[int] = Field(None, ge=0, le=23)
    month: Optional[int] = Field(None, ge=1, le=12)
    prediction: Optional[int] = Field(None, description="1 for Normal, -1 for Potential Anomaly")
    anomaly_score: Optional[float] = Field(None, description="Isolation Forest decision function score")
    status: Optional[str] = Field(None, description="'Normal' or 'Potential Anomaly'")


class WeatherFilterParams(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    search: Optional[str] = None
    sort_by: str = "time"
    sort_dir: str = "asc"
    page: int = Field(1, ge=1)
    limit: int = Field(50, ge=1, le=50000)


class PaginatedWeatherResponse(BaseModel):
    items: List[WeatherRecord]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool


class MetricSummary(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    count: int = 0
    missing_count: int = 0


class WeatherSummaryResponse(BaseModel):
    total_records: int
    normal_count: int
    anomaly_count: int
    anomaly_percentage: float
    earliest_timestamp: Optional[str] = None
    latest_timestamp: Optional[str] = None
    temperature_summary: MetricSummary
    humidity_summary: MetricSummary
    data_freshness: str
    dataset_type: str = "Historical Observed Station 02956"
