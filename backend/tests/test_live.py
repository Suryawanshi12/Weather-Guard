import pytest
from unittest.mock import patch, AsyncMock
from backend.app.schemas.live import LiveWeatherObservation


def test_get_preset_cities(client):
    response = client.get("/api/live/cities")
    assert response.status_code == 200
    cities = response.json()
    assert len(cities) >= 5
    city_names = [c["name"] for c in cities]
    assert "Berlin" in city_names
    assert "London" in city_names
    assert "Tokyo" in city_names


def test_live_weather_ingest_and_clear(client):
    # Mock observation
    mock_obs = LiveWeatherObservation(
        location="Berlin, Germany",
        latitude=52.52,
        longitude=13.405,
        timestamp="2026-10-17 03:00:00",
        temp=11.5,
        rhum=82.0,
        temp_change=0.5,
        humidity_change=-2.0,
        hour=3,
        month=10,
        raw_source="Test Mock",
    )

    with patch("backend.app.services.live_weather_service.live_weather_service.fetch_live_weather", new=AsyncMock(return_value=mock_obs)):
        # 1. Fetch live weather with auto_ingest=True
        resp = client.post("/api/live/fetch", json={"city_id": "berlin", "auto_ingest": True})
        assert resp.status_code == 200
        data = resp.json()
        assert data["observation"]["location"] == "Berlin, Germany"
        assert data["ingested"] is True
        assert "anomaly_score" in data

        # 2. Check summary reflects the newly ingested live record (1555 + 1 = 1556)
        sum_resp = client.get("/api/summary")
        assert sum_resp.status_code == 200
        sum_data = sum_resp.json()
        assert sum_data["total_records"] == 1556

        # 3. Clear live records
        clear_resp = client.post("/api/live/clear")
        assert clear_resp.status_code == 200
        assert clear_resp.json()["cleared_count"] >= 1

        # 4. Verify summary is restored back to 1555
        sum_restored = client.get("/api/summary")
        assert sum_restored.json()["total_records"] == 1555
