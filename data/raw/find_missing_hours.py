
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "station_02956_observed.csv"
OUTPUT_FILE = BASE_DIR / "missing_hours.csv"

df = pd.read_csv(INPUT_FILE)
df["time"] = pd.to_datetime(df["time"])

available = pd.DatetimeIndex(df["time"].drop_duplicates()).sort_values()

expected = pd.date_range(
    start=available.min(),
    end=pd.Timestamp("2024-12-31 23:00:00"),
    freq="h"
)

missing = expected.difference(available)

missing_df = pd.DataFrame({"missing_time": missing})
missing_df.to_csv(OUTPUT_FILE, index=False)

print("Expected hourly timestamps:", len(expected))
print("Available unique timestamps:", len(available))
print("Missing timestamps:", len(missing))
print("\nFirst 20 missing timestamps:")
print(missing_df.head(20).to_string(index=False))
print("\nSaved to:", OUTPUT_FILE)
