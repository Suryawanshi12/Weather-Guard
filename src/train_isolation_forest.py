
from pathlib import Path
import pandas as pd
import joblib

from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report

ROOT_DIR = Path(__file__).resolve().parent.parent

TRAIN_FILE = ROOT_DIR / "data" / "processed" / "X_train_scaled.csv"
TEST_FILE = ROOT_DIR / "data" / "processed" / "X_test_scaled.csv"

MODEL_FILE = ROOT_DIR / "models" / "isolation_forest.pkl"
RESULT_FILE = ROOT_DIR / "reports" / "anomaly_predictions.csv"

# Load scaled features
X_train = pd.read_csv(TRAIN_FILE)
X_test = pd.read_csv(TEST_FILE)

# Create Isolation Forest model
model = IsolationForest(
    n_estimators=200,
    contamination="auto",
    random_state=42,
    n_jobs=-1
)

# Train using training data only
model.fit(X_train)

# Predict anomalies on unseen testing data
predictions = model.predict(X_test)
scores = model.decision_function(X_test)

# Convert predictions:
# 1 = Normal, -1 = Anomaly
results = X_test.copy()
results["prediction"] = predictions
results["anomaly_score"] = scores
results["status"] = results["prediction"].map({
    1: "Normal",
    -1: "Anomaly"
})

# Save model and predictions
MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
RESULT_FILE.parent.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_FILE)
results.to_csv(RESULT_FILE, index=False)

# Display summary
total = len(results)
anomalies = int((predictions == -1).sum())
normal = int((predictions == 1).sum())

print("Isolation Forest training completed!")
print("Training records:", len(X_train))
print("Testing records:", total)
print("Normal records:", normal)
print("Potential anomalies:", anomalies)
print("Anomaly percentage:", round(anomalies / total * 100, 2), "%")
print("Model saved:", MODEL_FILE)
print("Predictions saved:", RESULT_FILE)
