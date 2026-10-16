from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CityPreset(BaseModel):
    id: str
    name: str
    country: str
    latitude: float
    longitude: float
    region: str


class FetchLiveWeatherRequest(BaseModel):
    city_id: Optional[str] = None
    city_name: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    auto_ingest: bool = Field(False, description="Whether to automatically ingest into active weather dataset")


class LiveWeatherObservation(BaseModel):
    location: str
    latitude: float
    longitude: float
    timestamp: str
    temp: float
    rhum: float
    temp_change: float
    humidity_change: float
    hour: int
    month: int
    weather_code: int = 0
    condition_text: str = "Clear Sky"
    wind_speed: float = 0.0
    is_day: int = 1
    hourly_forecast: List[Dict[str, Any]] = Field(default_factory=list)
    raw_source: str = "Open-Meteo API (Live)"


class LiveWeatherResponse(BaseModel):
    observation: LiveWeatherObservation
    prediction: int
    status: str
    anomaly_score: float
    is_anomaly: bool
    confidence_description: str
    scaled_features: Dict[str, float]
    ingested: bool
    notice: str
