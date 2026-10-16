
from pathlib import Path
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent

TEST_FILE = ROOT_DIR / "data" / "processed" / "weather_test.csv"
RESULT_FILE = ROOT_DIR / "reports" / "anomaly_predictions_05.csv"
SYNTHETIC_REPORT = (
    ROOT_DIR / "reports" / "synthetic_model_evaluation.txt"
)
REPORT_FILE = ROOT_DIR / "reports" / "model_evaluation.txt"

test_df = pd.read_csv(TEST_FILE)
results = pd.read_csv(RESULT_FILE)

total = len(results)
anomalies = int((results["prediction"] == -1).sum())
normal = int((results["prediction"] == 1).sum())

with open(REPORT_FILE, "w", encoding="utf-8") as f:
    f.write("WEATHERGUARD MODEL EVALUATION REPORT\n")
    f.write("=" * 45 + "\n\n")

    f.write("1. DATA SUMMARY\n")
    f.write(f"Test records: {len(test_df)}\n")
    f.write(f"Prediction records: {total}\n")
    f.write(
        "Missing values in test data: "
        f"{test_df.isna().sum().sum()}\n"
    )
    f.write(
        "Duplicate rows in test data: "
        f"{test_df.duplicated().sum()}\n\n"
    )

    f.write("2. ORIGINAL MODEL PREDICTIONS\n")
    f.write(f"Normal records: {normal}\n")
    f.write(f"Potential anomalies: {anomalies}\n")

    if total > 0:
        f.write(
            f"Anomaly rate: {anomalies / total * 100:.2f}%\n\n"
        )
    else:
        f.write("Anomaly rate: N/A (no predictions)\n\n")

    f.write("3. ANOMALY SCORE SUMMARY\n")
    if "anomaly_score" in results.columns:
        f.write(results["anomaly_score"].describe().to_string())
    else:
        f.write("Anomaly score column unavailable.")
    f.write("\n\n")

    f.write("4. SYNTHETIC EVALUATION\n")
    f.write(
        "Synthetic test metrics are stored separately in:\n"
    )
    f.write(f"{SYNTHETIC_REPORT}\n")

    if SYNTHETIC_REPORT.exists():
        f.write("\n")
        f.write(
            SYNTHETIC_REPORT.read_text(encoding="utf-8")
        )
    else:
        f.write(
            "Synthetic evaluation report not found. "
            "Run python src/test_model_accuracy.py first.\n"
        )

    f.write("\n\n5. LIMITATIONS\n")
    f.write(
        "The original weather test data has no verified "
        "ground-truth anomaly labels.\n"
    )
    f.write(
        "Therefore, real-world accuracy, precision, recall, "
        "F1-score, and confusion matrix cannot be established "
        "from the original predictions alone.\n"
    )
    f.write(
        "Synthetic evaluation metrics must not be presented "
        "as verified real-world model accuracy.\n"
    )

print("Final evaluation report updated!")
print("Test records:", total)
print("Potential anomalies:", anomalies)
print("Normal records:", normal)
if total > 0:
    print("Anomaly rate:", round(anomalies / total * 100, 2), "%")
print("Report saved:", REPORT_FILE)
