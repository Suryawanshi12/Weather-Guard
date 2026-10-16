
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent

RESULT_FILE = ROOT / "reports" / "anomaly_predictions_05.csv"
OUTPUT_DIR = ROOT / "reports" / "figures"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(RESULT_FILE)
df["time"] = pd.to_datetime(df["time"])
df = df.sort_values("time")

anomalies = df[df["prediction"] == -1]
normal_count = int((df["prediction"] == 1).sum())
anomaly_count = len(anomalies)

# Graph 1: Normal vs anomaly counts
plt.figure(figsize=(7, 5))
plt.bar(
    ["Normal", "Potential Anomaly"],
    [normal_count, anomaly_count],
)
plt.title("WeatherGuard: Prediction Summary")
plt.ylabel("Number of records")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "prediction_counts.png", dpi=150)
plt.close()

# Graph 2: Temperature over time with detected anomalies
plt.figure(figsize=(12, 5))
plt.plot(df["time"], df["temp"], label="Temperature", linewidth=1)

plt.scatter(
    anomalies["time"],
    anomalies["temp"],
    label="Potential anomaly",
    s=20,
)

plt.title("Temperature and Detected Anomalies")
plt.xlabel("Time")
plt.ylabel("Temperature (°C)")
plt.legend()
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "temperature_anomalies.png", dpi=150)
plt.close()

# Graph 3: Anomaly score distribution
plt.figure(figsize=(8, 5))
plt.hist(df["anomaly_score"].dropna(), bins=30)
plt.title("Isolation Forest Anomaly Score Distribution")
plt.xlabel("Anomaly score")
plt.ylabel("Number of records")
plt.tight_layout()
plt.savefig(
    OUTPUT_DIR / "anomaly_score_distribution.png",
    dpi=150,
)
plt.close()

print("Visualization completed!")
print("Normal records:", normal_count)
print("Potential anomalies:", anomaly_count)
print("Graphs saved in:", OUTPUT_DIR)
print("1. prediction_counts.png")
print("2. temperature_anomalies.png")
print("3. anomaly_score_distribution.png")
