
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "station_02956.csv"
OUTPUT_FILE = BASE_DIR / "station_02956_observed.csv"

df = pd.read_csv(INPUT_FILE)

# Keep records where temperature and humidity
# both come from actual observation sources.
observed = df[
    (df["temp_source"] == "isd_lite") &
    (df["rhum_source"] == "isd_lite")
].copy()

# Remove columns that contain no values.
observed = observed.dropna(axis=1, how="all")

# Save the filtered dataset.
observed.to_csv(OUTPUT_FILE, index=False)

print("Original records:", len(df))
print("Observed records:", len(observed))
print("Output file:", OUTPUT_FILE)
print("\nMissing values:")
print(observed.isna().sum().to_string())
print("\nTemperature sources:")
print(observed["temp_source"].value_counts().to_string())
print("\nHumidity sources:")
print(observed["rhum_source"].value_counts().to_string())
