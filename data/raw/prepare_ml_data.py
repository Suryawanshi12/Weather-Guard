
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "station_02956_segments.csv"
OUTPUT_FILE = BASE_DIR / "station_02956_ml.csv"

df = pd.read_csv(INPUT_FILE)
df["time"] = pd.to_datetime(df["time"])
df = df.sort_values("time").reset_index(drop=True)

# Use only actual-observation temperature and humidity.
df = df[
    (df["temp_source"] == "isd_lite") &
    (df["rhum_source"] == "isd_lite")
].copy()

# Create time-based features.
df["hour"] = df["time"].dt.hour
df["month"] = df["time"].dt.month

# Calculate changes only within continuous segments.
df["temp_change"] = df.groupby("segment_id")["temp"].diff()
df["humidity_change"] = df.groupby("segment_id")["rhum"].diff()

# Keep raw readings and derived features.
feature_columns = [
    "station",
    "time",
    "segment_id",
    "temp",
    "rhum",
    "hour",
    "month",
    "temp_change",
    "humidity_change",
]

ml_df = df[feature_columns].copy()

# Keep first records of segments; their change features remain missing.
ml_df.to_csv(OUTPUT_FILE, index=False)

print("ML dataset shape:", ml_df.shape)
print("\nMissing feature values:")
print(ml_df[["temp", "rhum", "temp_change", "humidity_change"]].isna().sum())
print("\nSaved to:", OUTPUT_FILE)
