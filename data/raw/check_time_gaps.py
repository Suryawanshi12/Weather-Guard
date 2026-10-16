
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "station_02956_observed.csv"

df = pd.read_csv(INPUT_FILE)
df["time"] = pd.to_datetime(df["time"])
df = df.sort_values("time").reset_index(drop=True)

# Calculate the time difference between consecutive records.
df["time_gap"] = df["time"].diff()

print("Total records:", len(df))
print("First timestamp:", df["time"].min())
print("Last timestamp:", df["time"].max())

print("\nTime gap distribution:")
print(df["time_gap"].value_counts().head(10).to_string())

# A gap larger than one hour means at least one
# expected hourly record is missing.
gaps = df[df["time_gap"] > pd.Timedelta(hours=1)]

print("\nGaps larger than 1 hour:", len(gaps))

if not gaps.empty:
    print("\nFirst 10 gaps:")
    print(
        gaps[["time", "time_gap"]]
        .head(10)
        .to_string(index=False)
    )

expected_hours = int(
    (df["time"].max() - df["time"].min()).total_seconds() / 3600
) + 1

print("\nExpected hourly records:", expected_hours)
print("Available records:", len(df))
print("Missing hourly records:", expected_hours - len(df))
