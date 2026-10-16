
from pathlib import Path
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    ROOT_DIR / "data" / "processed" / "station_02956_ml.csv"
)
OUTPUT_FILE = (
    ROOT_DIR / "data" / "processed" / "station_02956_clean.csv"
)

df = pd.read_csv(INPUT_FILE)
df["time"] = pd.to_datetime(df["time"])

# Sort records chronologically.
df = df.sort_values("time").reset_index(drop=True)

# Remove exact duplicate rows, if any.
df = df.drop_duplicates()

# Remove duplicate timestamps, if any.
df = df.drop_duplicates(subset=["station", "time"])

# Keep physically valid temperature and humidity values.
df = df[
    df["temp"].between(-50, 60)
    & df["rhum"].between(0, 100)
].copy()

# Recalculate changes within each continuous segment.
df["temp_change"] = df.groupby("segment_id")["temp"].diff()
df["humidity_change"] = df.groupby("segment_id")["rhum"].diff()

# Save all valid readings. Keep segment-start changes as NaN.
df.to_csv(OUTPUT_FILE, index=False)

print("Cleaning completed.")
print("Final records:", len(df))
print("Final columns:", len(df.columns))
print("Duplicate timestamps:", df["time"].duplicated().sum())

print("\nMissing values:")
print(df.isna().sum().to_string())

print("\nSaved cleaned dataset to:")
print(OUTPUT_FILE)
