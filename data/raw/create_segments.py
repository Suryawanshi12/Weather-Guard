
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).parent
INPUT_FILE = BASE_DIR / "station_02956_observed.csv"
OUTPUT_FILE = BASE_DIR / "station_02956_segments.csv"

df = pd.read_csv(INPUT_FILE)
df["time"] = pd.to_datetime(df["time"])
df = df.sort_values("time").reset_index(drop=True)

# Start a new segment whenever consecutive observations
# are separated by more than one hour.
time_gap = df["time"].diff()
df["segment_id"] = (time_gap > pd.Timedelta(hours=1)).cumsum()

# Save segmented observations without filling missing hours.
df.to_csv(OUTPUT_FILE, index=False)

segment_sizes = df.groupby("segment_id").size()

print("Total observations:", len(df))
print("Number of continuous segments:", len(segment_sizes))
print("Largest segment:", int(segment_sizes.max()), "records")
print("Smallest segment:", int(segment_sizes.min()), "records")
print("\nSegment size distribution:")
print(segment_sizes.describe().to_string())

print("\nSegments with at least 24 records:", int((segment_sizes >= 24).sum()))
print("Segments with at least 168 records:", int((segment_sizes >= 168).sum()))
print("\nSaved to:", OUTPUT_FILE)
