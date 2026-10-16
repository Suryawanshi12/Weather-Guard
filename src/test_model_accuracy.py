
from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

# --------------------------------------------------
# 1. Project paths
# --------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent

TRAIN_FILE = ROOT / "data" / "processed" / "weather_train.csv"
TEST_FILE = ROOT / "data" / "processed" / "weather_test.csv"
REPORT_FILE = ROOT / "reports" / "synthetic_model_evaluation.txt"

FEATURES = [
    "temp",
    "rhum",
    "temp_change",
    "humidity_change",
    "hour",
    "month",
]

# --------------------------------------------------
# 2. Load data
# --------------------------------------------------
train = pd.read_csv(TRAIN_FILE)
test = pd.read_csv(TEST_FILE)

print("WeatherGuard Model Evaluation")
print("=" * 45)
print("Training records:", len(train))
print("Testing records:", len(test))

# --------------------------------------------------
# 3. Prepare features
# --------------------------------------------------
X_train = train[FEATURES].copy()
X_test = test[FEATURES].copy()

X_train = X_train.replace([np.inf, -np.inf], np.nan)
X_test = X_test.replace([np.inf, -np.inf], np.nan)

# Use training medians only
medians = X_train.median()
X_train = X_train.fillna(medians)
X_test = X_test.fillna(medians)

# Scale features using training data only
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# --------------------------------------------------
# 4. Train Isolation Forest
# --------------------------------------------------
model = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train_scaled)

print("\nModel training completed.")

# --------------------------------------------------
# 5. Create synthetic evaluation dataset
# --------------------------------------------------
rng = np.random.default_rng(42)

X_normal = X_test_scaled.copy()
n_normal = len(X_normal)

# Select 5% of test rows to create synthetic anomalies
n_anomalies = max(1, int(n_normal * 0.05))

indices = rng.choice(
    n_normal,
    size=n_anomalies,
    replace=False,
)

# Only selected rows are treated as synthetic anomalies
X_anomaly = X_normal[indices].copy()

# Artificially perturb temperature and humidity
X_anomaly[:, 0] += 3.0
X_anomaly[:, 1] -= 3.0

# Combine normal-assumed and synthetic records
X_combined = np.vstack((X_normal, X_anomaly))

# 0 = assumed normal, 1 = synthetic anomaly
y_true = np.concatenate((
    np.zeros(n_normal, dtype=int),
    np.ones(n_anomalies, dtype=int),
))

print("\nSynthetic evaluation dataset created.")
print("Assumed-normal records:", n_normal)
print("Synthetic anomaly records:", n_anomalies)
print("Total evaluation records:", len(y_true))

# --------------------------------------------------
# 6. Predict
# --------------------------------------------------
predictions = model.predict(X_combined)

# Isolation Forest: -1 = anomaly, 1 = normal
y_pred = (predictions == -1).astype(int)

# --------------------------------------------------
# 7. Calculate metrics
# --------------------------------------------------
accuracy = accuracy_score(y_true, y_pred)
precision = precision_score(
    y_true, y_pred, zero_division=0
)
recall = recall_score(
    y_true, y_pred, zero_division=0
)
f1 = f1_score(
    y_true, y_pred, zero_division=0
)

matrix = confusion_matrix(
    y_true, y_pred, labels=[0, 1]
)

report = classification_report(
    y_true,
    y_pred,
    labels=[0, 1],
    target_names=["Assumed Normal", "Synthetic Anomaly"],
    zero_division=0,
)

# --------------------------------------------------
# 8. Print results
# --------------------------------------------------
print("\nSYNTHETIC EVALUATION RESULTS")
print("=" * 45)
print(f"Accuracy:  {accuracy * 100:.2f}%")
print(f"Precision: {precision * 100:.2f}%")
print(f"Recall:    {recall * 100:.2f}%")
print(f"F1-score:  {f1 * 100:.2f}%")

print("\nConfusion Matrix")
print("Rows = actual; columns = predicted")
print(matrix)

print("\nClassification Report")
print(report)

# --------------------------------------------------
# 9. Save report
# --------------------------------------------------
REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)

with open(REPORT_FILE, "w", encoding="utf-8") as file:
    file.write("WEATHERGUARD SYNTHETIC EVALUATION\n")
    file.write("=" * 45 + "\n")
    file.write(f"Training records: {len(train)}\n")
    file.write(f"Test records: {n_normal}\n")
    file.write(f"Synthetic anomalies: {n_anomalies}\n")
    file.write(f"Total evaluation records: {len(y_true)}\n\n")

    file.write(f"Accuracy: {accuracy * 100:.2f}%\n")
    file.write(f"Precision: {precision * 100:.2f}%\n")
    file.write(f"Recall: {recall * 100:.2f}%\n")
    file.write(f"F1-score: {f1 * 100:.2f}%\n\n")

    file.write("Confusion Matrix:\n")
    file.write(np.array2string(matrix))
    file.write("\n\nClassification Report:\n")
    file.write(report)

    file.write(
        "\nIMPORTANT: These metrics are from a synthetic experiment. "
        "They are not verified real-world model accuracy. "
        "Original test rows have not been confirmed as normal.\n"
    )

print("\nEvaluation completed successfully!")
print("Report saved to:", REPORT_FILE)
print("Note: These are synthetic-test metrics, not real-world accuracy.")
