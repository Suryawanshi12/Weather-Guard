# WeatherGuard — Full-Stack AI Weather Anomaly Detection System

WeatherGuard is a production-grade full-stack climate analytics and weather anomaly detection system. It leverages unsupervised **Isolation Forest** machine learning models trained on continuous observational telemetry from weather station **02956** to identify atypical atmospheric readings, sharp frontal swings, and potential sensor abnormalities.

---

## 1. System Architecture

```text
WeatherGuard/
├── backend/                  # FastAPI Application & REST APIs
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, CORS, lifespan handler
│   │   ├── api/v1/           # API routes (health, weather, anomalies, model, reports)
│   │   ├── core/             # Configuration (pydantic-settings) & logging
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   └── services/         # ML inference, weather analytics, report downloads
│   ├── tests/                # Pytest integration & unit test suite (14 tests)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment variables
├── frontend/                 # React 18 + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/       # Reusable UI (Sidebar, Header, StatCard, MetricBadge, etc.)
│   │   ├── pages/            # Overview, WeatherMonitoring, AnomalyDetection, ModelAnalysis, Reports, About
│   │   ├── services/         # Axios API client
│   │   ├── index.css         # Tailwind directives & design tokens
│   │   ├── App.jsx           # React Router and global layout
│   │   └── main.jsx          # React DOM entrypoint
│   ├── package.json          # Node dependencies & build scripts
│   ├── vite.config.js        # Vite build config & /api proxy to FastAPI
│   └── tailwind.config.js    # Custom navy/cyan/amber design tokens
├── data/
│   ├── raw/                  # Station CSVs & segment metadata
│   └── processed/            # Clean station observations (7,775 rows), train (6,220), test (1,555)
├── models/
│   ├── isolation_forest_05.pkl # Trained Isolation Forest (contamination=0.05, n_estimators=200)
│   └── weather_scaler.pkl     # StandardScaler fitted strictly on training data
├── reports/
│   ├── anomaly_predictions_05.csv    # Full test predictions, decision scores, and status tags
│   ├── model_evaluation.txt          # Statistical evaluation report
│   ├── synthetic_model_evaluation.txt# Experimental synthetic anomaly benchmark report
│   └── figures/                      # Histograms, counts, and scatter visualizations
└── README.md                 # System documentation & execution guide
```

---

## 2. Key Machine Learning Specifications

- **Algorithm**: `sklearn.ensemble.IsolationForest`
- **Hyperparameters**: `n_estimators=200`, `contamination=0.05`, `random_state=42`, `n_jobs=-1`
- **Features (Exact Order)**:
  1. `temp`: Ambient surface temperature (°C)
  2. `rhum`: Relative humidity (%)
  3. `temp_change`: 1-hour temperature difference within continuous segments (°C/h)
  4. `humidity_change`: 1-hour humidity difference within continuous segments (%/h)
  5. `hour`: Diurnal cycle index (0–23)
  6. `month`: Seasonal index (1–12)
- **Feature Scaling**: `StandardScaler` fitted **only** on the 6,220 training records.
- **Missing Value Strategy**: Imputed using median values derived exclusively from the training dataset (`temp=10.0`, `rhum=84.0`, `temp_change=0.0`, `humidity_change=0.0`, `hour=12.0`, `month=5.0`).
- **Dataset Split**: Chronological 80/20 split without shuffling (Train: Jan 1, 2024 – Oct 1, 2024; Test: Oct 1, 2024 – Dec 31, 2024).
- **Decision Score Definition**: Computed via `model.decision_function(X)`. Negative values (< 0.0) correspond to isolated outliers (**Potential Anomaly**); positive values (≥ 0.0) correspond to baseline conditions (**Normal**). Lower scores indicate greater statistical divergence.

### Scientific Integrity & Limitations Notice
> **Important**: Atmospheric observational records lack human-verified ground-truth anomaly tags. The **92.28% accuracy**, **37.93% precision**, **100% recall**, and **55% F1-score** documented in project reports originate strictly from an **artificial synthetic injection experiment** (77 synthetic anomalies injected under the working assumption that all original rows were normal). They **must not** be represented as verified real-world operational accuracy. WeatherGuard performs statistical anomaly detection, not weather forecasting.

---

## 3. Windows Setup & Run Instructions

### Prerequisites
- Python 3.10+ (with `pip`)
- Node.js 18+ and `npm`
- Windows PowerShell

### Step 1: Backend Setup & Execution

Open a PowerShell terminal in the project root:

```powershell
cd C:\Users\shrut\Desktop\WeatherGuard

# Optional: Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Run backend unit and integration tests
python -m pytest backend/tests -v

# Start the FastAPI server on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI backend will be live at:
- **API Base**: `http://127.0.0.1:8000`
- **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
- **Redoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### Step 2: Frontend Setup & Execution

Open a second PowerShell terminal:

```powershell
cd C:\Users\shrut\Desktop\WeatherGuard\frontend

# Install dependencies
npm install

# Build production bundle to verify correctness
npm run build

# Start local development server on port 5173
npm run dev
```

The React frontend dashboard will be available at:
- **Application URL**: `http://localhost:5173`

---

## 4. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, model status, and record count |
| `GET` | `/api/summary` | Aggregate statistics (totals, anomaly rate, temperature & humidity distributions) |
| `GET` | `/api/weather` | Paginated weather observations with search, sorting, and status/temperature filters |
| `GET` | `/api/weather/export` | Stream downloadable CSV of currently filtered weather records |
| `GET` | `/api/anomalies` | Paginated potential anomalies sorted by score severity |
| `GET` | `/api/analytics` | Anomaly score distribution histogram, monthly/hourly rates, and severity breakdown |
| `GET` | `/api/model-info` | Model hyperparameters, training split ranges, scaler means/scales, and feature order |
| `GET` | `/api/evaluation` | Prediction distribution, synthetic experiment metrics, confusion matrix, and limitations |
| `GET` | `/api/reports` | Catalog of verified downloadable reports with file sizes and timestamps |
| `GET` | `/api/reports/{name}/download` | Secure download endpoint restricted to pre-approved report files |
| `POST` | `/api/predict` | Real-time inference endpoint using the fitted Isolation Forest model |

### Example API Invocations

#### 1. Live Anomaly Prediction (`POST /api/predict`)

**Request**:
```bash
curl -X POST "http://127.0.0.1:8000/api/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "temp": -8.0,
       "rhum": 92.0,
       "temp_change": -9.5,
       "humidity_change": 25.0,
       "hour": 15,
       "month": 11
     }'
```

**Response**:
```json
{
  "prediction": -1,
  "status": "Potential Anomaly",
  "anomaly_score": -0.12451,
  "is_anomaly": true,
  "confidence_description": "High statistical divergence from baseline patterns",
  "imputed_values": {},
  "scaled_features": {
    "temp": -1.2981,
    "rhum": 0.6928,
    "temp_change": -8.5262,
    "humidity_change": 4.6517,
    "hour": 0.5083,
    "month": 2.3291
  },
  "notice": "Model assessment only. This statistical detection is not an official weather warning or forecast."
}
```

#### 2. Query Paginated Anomalies (`GET /api/anomalies`)

```bash
curl "http://127.0.0.1:8000/api/anomalies?page=1&limit=5&sort_by=anomaly_score&sort_dir=asc"
```

---

## 5. Security & Architectural Best Practices

1. **Path Traversal Protection**: The `/api/reports/{report_name}/download` endpoint explicitly validates filenames against a strict whitelist (`PERMITTED_REPORTS`). Requests containing relative parent directories (`..`) are rejected with `403 Forbidden`.
2. **Deterministic Preprocessing**: Live inference maps incoming records to standard Pandas DataFrames matching exact feature column names, imputing missing optional values with frozen training medians without silent refitting.
3. **No Leakage**: The `StandardScaler` was strictly fitted to the 80% chronological training window and persisted in `models/weather_scaler.pkl`.
4. **CORS Governance**: Configurable allowed origins via environment settings with defaults matching Vite development ports.
5. **Robust Error Handling**: Global exception interceptor ensures raw stack traces and internal filesystem paths are never leaked to end users in production mode (`DEBUG=False`).

---

## 6. Testing Summary

- **Backend Pytest Suite**: 14 tests covering health check, summary, pagination, sorting, filtering, CSV export, score severity, model metadata, synthetic evaluation disclaimer, valid predictions, edge-case anomalies, imputation behavior, and unauthorized report download attempts.
- **Frontend Build**: Verified production build using `npm run build` compiling 2,462 modules in 11.2s into minified assets in `frontend/dist/`.
- **End-to-End Validation**: Verified via browser subagent across all 6 pages with interactive prediction simulations.
