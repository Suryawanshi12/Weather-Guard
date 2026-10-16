from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    temp: float = Field(..., description="Temperature in °C (-50.0 to 60.0)")
    rhum: float = Field(..., description="Relative humidity in % (0.0 to 100.0)")
    temp_change: Optional[float] = Field(None, description="Temperature change over last hour in °C")
    humidity_change: Optional[float] = Field(None, description="Humidity change over last hour in %")
    hour: Optional[int] = Field(None, ge=0, le=23, description="Hour of the day (0-23)")
    month: Optional[int] = Field(None, ge=1, le=12, description="Month of the year (1-12)")


class PredictResponse(BaseModel):
    prediction: int = Field(..., description="1 for Normal, -1 for Potential Anomaly")
    status: str = Field(..., description="'Normal' or 'Potential Anomaly'")
    anomaly_score: float = Field(..., description="Isolation Forest decision score; < 0 indicates anomaly")
    is_anomaly: bool
    confidence_description: str
    imputed_values: Dict[str, float] = Field(default_factory=dict)
    scaled_features: Dict[str, float] = Field(default_factory=dict)
    notice: str = (
        "Model assessment only. This statistical detection is not an official weather warning or forecast."
    )


class ModelInfoResponse(BaseModel):
    model_name: str
    algorithm: str
    parameters: Dict[str, Any]
    features: List[str]
    training_records: int
    test_records: int
    train_period: Dict[str, str]
    test_period: Dict[str, str]
    scaler_type: str
    scaler_means: Dict[str, float]
    scaler_scales: Dict[str, float]
    imputation_medians: Dict[str, float]
    feature_order: List[str]
    is_loaded: bool
    status: str


class SyntheticMetricSection(BaseModel):
    accuracy: float = 92.28
    precision: float = 37.93
    recall: float = 100.00
    f1_score: float = 55.00
    confusion_matrix: List[List[int]] = [[1429, 126], [0, 77]]
    assumed_normal_records: int = 1555
    synthetic_anomaly_records: int = 77
    total_eval_records: int = 1632
    disclaimer: str = (
        "IMPORTANT: These metrics are strictly derived from a synthetic anomaly experiment "
        "where 77 artificial anomalies were injected. They do NOT reflect verified real-world "
        "model accuracy because historical weather data lacks verified ground-truth labels."
    )


class EvaluationResponse(BaseModel):
    test_records: int
    normal_predictions: int
    potential_anomalies: int
    anomaly_rate: float
    score_statistics: Dict[str, float]
    synthetic_experiment: SyntheticMetricSection
    limitations: List[str]
