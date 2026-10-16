import pytest


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "documentation" in data
    assert data["health"] == "/api/health"


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["records_loaded"] == 1555


def test_summary_endpoint(client):
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_records"] == 1555
    assert data["normal_count"] == 1429
    assert data["anomaly_count"] == 126
    assert abs(data["anomaly_percentage"] - 8.10) < 0.1
    assert data["temperature_summary"]["count"] > 0
    assert data["humidity_summary"]["count"] > 0


def test_weather_pagination_and_filtering(client):
    # Default page
    response = client.get("/api/weather?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] == 1555
    assert data["page"] == 1
    assert data["total_pages"] == 156
    assert data["has_next"] is True
    assert data["has_prev"] is False

    # Filter status: Anomaly
    response_anom = client.get("/api/weather?status=anomaly&limit=50")
    assert response_anom.status_code == 200
    data_anom = response_anom.json()
    assert data_anom["total"] == 126
    for item in data_anom["items"]:
        assert item["status"] == "Potential Anomaly"
        assert item["prediction"] == -1

    # Filter status: Normal
    response_norm = client.get("/api/weather?status=normal&limit=50")
    assert response_norm.status_code == 200
    data_norm = response_norm.json()
    assert data_norm["total"] == 1429
    for item in data_norm["items"]:
        assert item["status"] == "Normal"
        assert item["prediction"] == 1


def test_anomalies_endpoint(client):
    response = client.get("/api/anomalies?page=1&limit=20&sort_by=anomaly_score&sort_dir=asc")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 126
    assert len(data["items"]) == 20
    # First item should be the most anomalous (lowest score)
    first_score = data["items"][0]["anomaly_score"]
    second_score = data["items"][1]["anomaly_score"]
    assert first_score <= second_score
    assert first_score < 0
    assert data["items"][0]["status"] == "Potential Anomaly"


def test_analytics_endpoint(client):
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_anomalies"] == 126
    assert data["total_records"] == 1555
    assert abs(data["anomaly_rate"] - 8.10) < 0.1
    assert len(data["score_distribution"]) > 0
    assert len(data["anomalies_by_month"]) > 0
    assert len(data["anomalies_by_hour"]) > 0
    assert "Severe" in data["anomalies_by_severity"]


def test_model_info_endpoint(client):
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["is_loaded"] is True
    assert data["training_records"] == 6220
    assert data["test_records"] == 1555
    assert data["parameters"]["contamination"] == 0.05
    assert data["parameters"]["n_estimators"] == 200
    assert data["features"] == ["temp", "rhum", "temp_change", "humidity_change", "hour", "month"]


def test_evaluation_endpoint(client):
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["test_records"] == 1555
    assert data["normal_predictions"] == 1429
    assert data["potential_anomalies"] == 126
    synth = data["synthetic_experiment"]
    assert synth["accuracy"] == 92.28
    assert synth["precision"] == 37.93
    assert synth["recall"] == 100.00
    assert synth["f1_score"] == 55.00
    assert len(data["limitations"]) > 0


def test_predict_endpoint_valid_normal(client):
    payload = {
        "temp": 12.0,
        "rhum": 65.0,
        "temp_change": 0.2,
        "humidity_change": -1.0,
        "hour": 14,
        "month": 6
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "anomaly_score" in data
    assert "status" in data
    assert "notice" in data


def test_predict_endpoint_extreme_anomaly(client):
    # Extreme temperature flash drop
    payload = {
        "temp": -35.0,
        "rhum": 15.0,
        "temp_change": -25.0,
        "humidity_change": 40.0,
        "hour": 12,
        "month": 7
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == -1
    assert data["is_anomaly"] is True
    assert data["status"] == "Potential Anomaly"
    assert data["anomaly_score"] < 0


def test_predict_endpoint_missing_optional_uses_medians(client):
    # Only supply required temp and rhum; optional values should be imputed with training medians
    payload = {
        "temp": 10.0,
        "rhum": 84.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "temp_change" in data["imputed_values"]
    assert "humidity_change" in data["imputed_values"]
    assert data["imputed_values"]["temp_change"] == 0.0


def test_predict_endpoint_invalid_values(client):
    # Invalid temperature > 60°C
    response = client.post("/api/predict", json={"temp": 95.0, "rhum": 50.0})
    assert response.status_code == 422

    # Invalid humidity > 100%
    response_rhum = client.post("/api/predict", json={"temp": 20.0, "rhum": 120.0})
    assert response_rhum.status_code == 422


def test_reports_listing_and_download(client):
    response = client.get("/api/reports")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    filenames = [r["filename"] for r in data["reports"]]
    assert "anomaly_predictions_05.csv" in filenames
    assert "model_evaluation.txt" in filenames

    # Valid download
    dl_resp = client.get("/api/reports/model_evaluation.txt/download")
    assert dl_resp.status_code == 200
    assert "WEATHERGUARD MODEL EVALUATION REPORT" in dl_resp.text

    # Unauthorized path / path traversal prevention
    bad_resp = client.get("/api/reports/../../passwords.txt/download")
    assert bad_resp.status_code in [403, 404]

    bad_resp2 = client.get("/api/reports/unknown_file.csv/download")
    assert bad_resp2.status_code == 403


def test_csv_export(client):
    response = client.get("/api/weather/export?status=anomaly")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    content = response.text
    assert "time,temp,rhum" in content
    # Should contain 126 records + header
    lines = [line for line in content.strip().split("\n") if line]
    assert len(lines) == 127
