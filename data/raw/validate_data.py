
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
CSV_FILE = BASE_DIR / "station_02956.csv"

if not CSV_FILE.exists():
    raise FileNotFoundError(f"CSV not found: {CSV_FILE}")

df = pd.read_csv(CSV_FILE)

print("Dataset shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 observations:")
print(df.head().to_string(index=False))

print("\nMissing values:")
print(df.isna().sum().to_string())

print("\nObservation sources:")
for col in df.columns:
    if col.endswith("_source"):
        print(f"\n{col}:")
        print(df[col].value_counts(dropna=False).to_string())

print("\nTime range:")
df["time"] = pd.to_datetime(df["time"], errors="coerce")
print("Start:", df["time"].min())
print("End:", df["time"].max())

print("\nDuplicate timestamps:", df.duplicated(
    subset=["station", "time"]
).sum())
