from typing import List, Optional
from fastapi import APIRouter, HTTPException

from backend.app.schemas.live import (
    CityPreset,
    FetchLiveWeatherRequest,
    LiveWeatherResponse,
)
from backend.app.services.live_weather_service import live_weather_service
from backend.app.services.weather_service import weather_service

router = APIRouter(prefix="/live", tags=["Live Real-World Weather"])


@router.get("/cities", response_model=List[CityPreset])
def get_preset_cities():
    """Retrieve global city presets with coordinates for real-time weather polling."""
    return live_weather_service.get_preset_cities()


@router.get("/stations-map", response_model=List[LiveWeatherResponse])
async def get_all_stations_map():
    """Concurrently fetches live telemetry for all preset stations for the interactive visual radar map."""
    return await live_weather_service.get_all_stations_live()


@router.post("/fetch", response_model=LiveWeatherResponse)
async def fetch_and_evaluate_live_weather(req: FetchLiveWeatherRequest):
    """
    Fetch real-time atmospheric measurements from Open-Meteo API for any city or coordinates,
    compute 1-hour changes, evaluate through the trained Isolation Forest model,
    and optionally ingest into the active weather dataset.
    """
    obs = await live_weather_service.fetch_live_weather(
        city_id=req.city_id,
        city_name=req.city_name,
        latitude=req.latitude,
        longitude=req.longitude,
    )

    result = live_weather_service.analyze_live_weather(obs)

    if req.auto_ingest:
        weather_service.ingest_live_record(
            time_str=obs.timestamp,
            temp=obs.temp,
            rhum=obs.rhum,
            temp_change=obs.temp_change,
            humidity_change=obs.humidity_change,
            hour=obs.hour,
            month=obs.month,
            prediction=result.prediction,
            anomaly_score=result.anomaly_score,
            status=result.status,
            location=obs.location,
        )
        result.ingested = True

    return result


@router.post("/ingest")
def ingest_observation(res: LiveWeatherResponse):
    """Manually ingest a previously fetched live observation into the active dataset."""
    obs = res.observation
    ingest_meta = weather_service.ingest_live_record(
        time_str=obs.timestamp,
        temp=obs.temp,
        rhum=obs.rhum,
        temp_change=obs.temp_change,
        humidity_change=obs.humidity_change,
        hour=obs.hour,
        month=obs.month,
        prediction=res.prediction,
        anomaly_score=res.anomaly_score,
        status=res.status,
        location=obs.location,
    )
    return {
        "status": "success",
        "message": f"Successfully ingested live reading for {obs.location} into active dataset.",
        "details": ingest_meta,
    }


@router.post("/clear")
def clear_live_records():
    """Remove all live-ingested readings and reset dataset to baseline historical test set."""
    cleared = weather_service.clear_live_records()
    return {
        "status": "success",
        "cleared_count": cleared,
        "current_total": len(weather_service.df),
    }
