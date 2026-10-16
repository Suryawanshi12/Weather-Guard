from datetime import datetime, timezone
import asyncio
from typing import List, Optional, Tuple, Dict, Any
import httpx
from fastapi import HTTPException

from backend.app.schemas.live import CityPreset, LiveWeatherObservation, LiveWeatherResponse
from backend.app.schemas.model import PredictRequest
from backend.app.services.ml_service import ml_service
from backend.app.core.logging import logger

PRESET_CITIES: List[CityPreset] = [
    CityPreset(id="berlin", name="Berlin", country="Germany", latitude=52.5200, longitude=13.4050, region="Europe (Near St. 02956)"),
    CityPreset(id="frankfurt", name="Frankfurt", country="Germany", latitude=50.1109, longitude=8.6821, region="Europe"),
    CityPreset(id="london", name="London", country="United Kingdom", latitude=51.5074, longitude=-0.1278, region="Europe"),
    CityPreset(id="paris", name="Paris", country="France", latitude=48.8566, longitude=2.3522, region="Europe"),
    CityPreset(id="newyork", name="New York", country="United States", latitude=40.7128, longitude=-74.0060, region="North America"),
    CityPreset(id="tokyo", name="Tokyo", country="Japan", latitude=35.6762, longitude=139.6503, region="Asia"),
    CityPreset(id="delhi", name="New Delhi", country="India", latitude=28.6139, longitude=77.2090, region="Asia"),
    CityPreset(id="reykjavik", name="Reykjavik", country="Iceland", latitude=64.1466, longitude=-21.9426, region="Arctic / Subpolar"),
    CityPreset(id="dubai", name="Dubai", country="United Arab Emirates", latitude=25.2048, longitude=55.2708, region="Middle East / Arid"),
    CityPreset(id="sydney", name="Sydney", country="Australia", latitude=-33.8688, longitude=151.2093, region="Oceania"),
]

WMO_CODE_MAP = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow Fall",
    73: "Moderate Snow Fall",
    75: "Heavy Snow Fall",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail",
}


class LiveWeatherService:
    def get_preset_cities(self) -> List[CityPreset]:
        return PRESET_CITIES

    async def fetch_live_weather(
        self,
        city_id: Optional[str] = None,
        city_name: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> LiveWeatherObservation:
        # Resolve target coordinates and name
        loc_name = "Custom Location"
        lat = latitude
        lon = longitude

        if city_id:
            match = next((c for c in PRESET_CITIES if c.id == city_id), None)
            if match:
                loc_name = f"{match.name}, {match.country}"
                lat = match.latitude
                lon = match.longitude

        if lat is None or lon is None:
            default_city = PRESET_CITIES[0]
            loc_name = f"{default_city.name}, {default_city.country}"
            lat = default_city.latitude
            lon = default_city.longitude

        if city_name and loc_name == "Custom Location":
            loc_name = city_name

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
            "hourly": "temperature_2m,relative_humidity_2m",
            "past_days": 1,
            "forecast_days": 2,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, params=params)
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Open-Meteo weather service returned status {res.status_code}"
                    )
                data = res.json()
        except httpx.RequestError as exc:
            logger.error(f"Failed to connect to Open-Meteo: {exc}")
            raise HTTPException(
                status_code=503,
                detail=f"Unable to reach Open-Meteo live weather API: {str(exc)}"
            )

        current = data.get("current", {})
        temp = float(current.get("temperature_2m", 15.0))
        rhum = float(current.get("relative_humidity_2m", 70.0))
        weather_code = int(current.get("weather_code", 0))
        wind_speed = float(current.get("wind_speed_10m", 0.0))
        is_day = int(current.get("is_day", 1))
        condition_text = WMO_CODE_MAP.get(weather_code, "Atmospheric Observation")

        curr_time_str = current.get("time", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00"))

        # Calculate exact 1-hour changes from hourly history
        temp_change = 0.0
        rhum_change = 0.0
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        rhums = hourly.get("relative_humidity_2m", [])

        if curr_time_str in times:
            curr_idx = times.index(curr_time_str)
            if curr_idx > 0 and curr_idx < len(temps):
                prev_temp = temps[curr_idx - 1]
                prev_rhum = rhums[curr_idx - 1]
                if prev_temp is not None:
                    temp_change = round(temp - float(prev_temp), 2)
                if prev_rhum is not None:
                    rhum_change = round(rhum - float(prev_rhum), 2)
        elif len(temps) >= 2:
            temp_change = round(float(temps[-1]) - float(temps[-2]), 2)
            rhum_change = round(float(rhums[-1]) - float(rhums[-2]), 2)

        # Parse hour and month from time
        try:
            dt = datetime.fromisoformat(curr_time_str.replace("Z", "+00:00"))
        except Exception:
            dt = datetime.now(timezone.utc)

        formatted_timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")

        # Build 24-hour forecast curve
        hourly_forecast = []
        start_idx = times.index(curr_time_str) if curr_time_str in times else 0
        for i in range(start_idx, min(start_idx + 24, len(times))):
            t_str = times[i].replace("T", " ")[-5:]  # 'HH:MM'
            hourly_forecast.append({
                "time": t_str,
                "temp": round(float(temps[i]), 1) if temps[i] is not None else None,
                "rhum": round(float(rhums[i]), 1) if rhums[i] is not None else None,
            })

        return LiveWeatherObservation(
            location=loc_name,
            latitude=lat,
            longitude=lon,
            timestamp=formatted_timestamp,
            temp=round(temp, 2),
            rhum=round(rhum, 2),
            temp_change=temp_change,
            humidity_change=rhum_change,
            hour=dt.hour,
            month=dt.month,
            weather_code=weather_code,
            condition_text=condition_text,
            wind_speed=wind_speed,
            is_day=is_day,
            hourly_forecast=hourly_forecast,
            raw_source=f"Open-Meteo Live API ({loc_name})",
        )

    def analyze_live_weather(
        self,
        observation: LiveWeatherObservation,
    ) -> LiveWeatherResponse:
        predict_req = PredictRequest(
            temp=observation.temp,
            rhum=observation.rhum,
            temp_change=observation.temp_change,
            humidity_change=observation.humidity_change,
            hour=observation.hour,
            month=observation.month,
        )

        pred_res = ml_service.predict(predict_req)

        return LiveWeatherResponse(
            observation=observation,
            prediction=pred_res.prediction,
            status=pred_res.status,
            anomaly_score=pred_res.anomaly_score,
            is_anomaly=pred_res.is_anomaly,
            confidence_description=pred_res.confidence_description,
            scaled_features=pred_res.scaled_features,
            ingested=False,
            notice=(
                f"Live weather fetched in real time from Open-Meteo for {observation.location} at {observation.timestamp}. "
                "Evaluated dynamically by the WeatherGuard Isolation Forest model."
            ),
        )

    async def get_all_stations_live(self) -> List[LiveWeatherResponse]:
        """Concurrently fetches and evaluates live weather across all preset stations for the GIS Radar Map."""
        tasks = [self.fetch_live_weather(city_id=city.id) for city in PRESET_CITIES]
        observations = await asyncio.gather(*tasks, return_exceptions=True)

        results = []
        for obs in observations:
            if isinstance(obs, LiveWeatherObservation):
                results.append(self.analyze_live_weather(obs))
        return results


live_weather_service = LiveWeatherService()
