
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "station_02956_ml.csv"

df = pd.read_csv(INPUT_FILE)

print("Dataset shape:", df.shape)

print("\nFeature statistics:")
print(
    df[["temp", "rhum", "temp_change", "humidity_change"]]
    .describe()
    .round(2)
    .to_string()
)

print("\nTemperature outside -50 to 60 C:")
print(((df["temp"] < -50) | (df["temp"] > 60)).sum())

print("\nHumidity outside 0 to 100%:")
print(((df["rhum"] < 0) | (df["rhum"] > 100)).sum())

print("\nLargest temperature changes:")
idx = df["temp_change"].abs().nlargest(10).index
print(
    df.loc[idx, ["time", "temp", "temp_change", "segment_id"]]
    .to_string(index=False)
)

print("\nLargest humidity changes:")
idx = df["humidity_change"].abs().nlargest(10).index
print(
    df.loc[idx, ["time", "rhum", "humidity_change", "segment_id"]]
    .to_string(index=False)
)
