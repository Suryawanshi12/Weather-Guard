
from pathlib import Path
import pandas as pd

csv_file = (
    Path(__file__).parent
    / "data"
    / "raw"
    / "weather_2024.csv"
)

if not csv_file.exists():
    print("CSV not found. Conversion may not be complete.")
    raise SystemExit(1)

print("Reading first 5 rows...")
df = pd.read_csv(csv_file, nrows=5)

print("\nDataset columns:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.to_string(index=False))

print("\nData types:")
print(df.dtypes)
