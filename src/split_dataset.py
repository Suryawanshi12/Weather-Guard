
from pathlib import Path
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = ROOT_DIR / "data" / "processed" / "station_02956_clean.csv"
TRAIN_FILE = ROOT_DIR / "data" / "processed" / "weather_train.csv"
TEST_FILE = ROOT_DIR / "data" / "processed" / "weather_test.csv"

df = pd.read_csv(INPUT_FILE)
df["time"] = pd.to_datetime(df["time"])
df = df.sort_values("time").reset_index(drop=True)

# Chronological 80/20 split.
split_index = int(len(df) * 0.80)

train_df = df.iloc[:split_index].copy()
test_df = df.iloc[split_index:].copy()

train_df.to_csv(TRAIN_FILE, index=False)
test_df.to_csv(TEST_FILE, index=False)

print("Dataset split completed.")
print("Training records:", len(train_df))
print("Testing records:", len(test_df))
print("\nTraining period:")
print(train_df["time"].min(), "to", train_df["time"].max())
print("\nTesting period:")
print(test_df["time"].min(), "to", test_df["time"].max())
print("\nSaved files:")
print(TRAIN_FILE)
print(TEST_FILE)
