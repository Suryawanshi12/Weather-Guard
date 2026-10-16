
from pathlib import Path
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest

ROOT_DIR = Path(__file__).resolve().parent.parent

TRAIN_FILE = ROOT_DIR / "data" / "processed" / "X_train_scaled.csv"
TEST_FILE = ROOT_DIR / "data" / "processed" / "X_test_scaled.csv"
TEST_RAW_FILE = ROOT_DIR / "data" / "processed" / "weather_test.csv"

MODEL_FILE = ROOT_DIR / "models" / "isolation_forest_05.pkl"
RESULT_FILE = ROOT_DIR / "reports" / "anomaly_predictions_05.csv"

X_train = pd.read_csv(TRAIN_FILE)
X_test = pd.read_csv(TEST_FILE)
test_raw = pd.read_csv(TEST_RAW_FILE)

model = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train)

predictions = model.predict(X_test)
scores = model.decision_function(X_test)

results = test_raw[
    ["time", "temp", "rhum", "temp_change",
     "humidity_change", "hour", "month"]
].copy()

results["prediction"] = predictions
results["anomaly_score"] = scores
results["status"] = results["prediction"].map({
    1: "Normal",
    -1: "Anomaly"
})

MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
RESULT_FILE.parent.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_FILE)
results.to_csv(RESULT_FILE, index=False)

print("Model training completed!")
print("Testing records:", len(results))
print("Potential anomalies:", (predictions == -1).sum())
print("Normal records:", (predictions == 1).sum())
print("Anomaly percentage:",
      round((predictions == -1).mean() * 100, 2), "%")
print("Model saved:", MODEL_FILE)
print("Results saved:", RESULT_FILE)
