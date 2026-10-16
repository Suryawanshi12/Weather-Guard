from typing import Optional, List
from pydantic import BaseModel, Field


class AnomalyRecord(BaseModel):
    time: str
    temp: Optional[float] = None
    rhum: Optional[float] = None
    temp_change: Optional[float] = None
    humidity_change: Optional[float] = None
    hour: Optional[int] = None
    month: Optional[int] = None
    prediction: int = -1
    anomaly_score: float = Field(..., description="Decision function value; lower indicates more anomalous")
    status: str = "Potential Anomaly"
    severity: str = Field("Moderate", description="'Mild', 'Moderate', or 'Severe' based on score threshold")


class PaginatedAnomalyResponse(BaseModel):
    items: List[AnomalyRecord]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool


class AnomalyScoreBucket(BaseModel):
    bucket_min: float
    bucket_max: float
    count: int
    label: str


class AnomalyAnalyticsResponse(BaseModel):
    total_anomalies: int
    total_records: int
    anomaly_rate: float
    min_score: float
    max_score: float
    mean_score: float
    std_score: float
    score_distribution: List[AnomalyScoreBucket]
    anomalies_by_month: List[dict]
    anomalies_by_hour: List[dict]
    anomalies_by_severity: dict
