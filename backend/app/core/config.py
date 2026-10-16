from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "WeatherGuard Weather Anomaly Detection API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Allow CORS from React/Vite development server
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Base paths
    # backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> ROOT
    ROOT_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    
    # Directories
    DATA_PROCESSED_DIR: Path = ROOT_DIR / "data" / "processed"
    MODELS_DIR: Path = ROOT_DIR / "models"
    REPORTS_DIR: Path = ROOT_DIR / "reports"
    
    # Specific artifact files
    MODEL_PATH: Path = MODELS_DIR / "isolation_forest_05.pkl"
    SCALER_PATH: Path = MODELS_DIR / "weather_scaler.pkl"
    PREDICTIONS_PATH: Path = REPORTS_DIR / "anomaly_predictions_05.csv"
    EVALUATION_REPORT_PATH: Path = REPORTS_DIR / "model_evaluation.txt"
    SYNTHETIC_REPORT_PATH: Path = REPORTS_DIR / "synthetic_model_evaluation.txt"
    CLEAN_DATA_PATH: Path = DATA_PROCESSED_DIR / "station_02956_clean.csv"
    TRAIN_DATA_PATH: Path = DATA_PROCESSED_DIR / "weather_train.csv"
    TEST_DATA_PATH: Path = DATA_PROCESSED_DIR / "weather_test.csv"
    
    # ML Features and Preprocessing
    FEATURES: List[str] = [
        "temp",
        "rhum",
        "temp_change",
        "humidity_change",
        "hour",
        "month",
    ]
    
    # Default training medians verified from weather_train.csv
    TRAINING_MEDIANS: dict = {
        "temp": 10.0,
        "rhum": 84.0,
        "temp_change": 0.0,
        "humidity_change": 0.0,
        "hour": 12.0,
        "month": 5.0,
    }
    
    # Model parameters for metadata
    MODEL_TYPE: str = "IsolationForest"
    MODEL_PARAMS: dict = {
        "n_estimators": 200,
        "contamination": 0.05,
        "random_state": 42,
        "n_jobs": -1,
    }
    
    # Permitted report downloads
    PERMITTED_REPORTS: List[str] = [
        "anomaly_predictions_05.csv",
        "model_evaluation.txt",
        "synthetic_model_evaluation.txt",
        "station_02956_clean.csv",
        "weather_train.csv",
        "weather_test.csv",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
