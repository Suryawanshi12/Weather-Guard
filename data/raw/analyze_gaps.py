
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "station_02956_observed.csv"

df = pd.read_csv(INPUT_FILE)
df["time"] = pd.to_datetime(df["time"])
times = pd.DatetimeIndex(df["time"].drop_duplicates()).sort_values()

# Count missing hours between consecutive available timestamps.
gap_hours = (
    times.to_series().diff().dt.total_seconds().div(3600).sub(1).dropna()
)

missing_gaps = gap_hours[gap_hours > 0]

print("Number of gaps:", len(missing_gaps))
print("Total missing hours between observations:", int(missing_gaps.sum()))
print("Largest gap (hours):", int(missing_gaps.max()))

print("\nMissing-hour gap distribution:")
print(missing_gaps.value_counts().sort_index().to_string())

print("\nLargest 10 gaps:")
print(missing_gaps.sort_values(ascending=False).head(10).to_string())
