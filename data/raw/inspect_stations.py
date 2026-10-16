
from pathlib import Path
import pyarrow.dataset as ds
import pyarrow.compute as pc

input_file = Path(
    r"C:\Users\shrut\Desktop\WeatherGuard\data\raw\2024.parquet"
)

dataset = ds.dataset(input_file, format="parquet")

print("Station column type:", dataset.schema.field("station").type)

# Read only the station column in small batches
scanner = dataset.scanner(
    columns=["station"],
    batch_size=5000,
    use_threads=False
)

unique_stations = set()

for batch in scanner.to_batches():
    values = batch.column(0).to_pylist()
    unique_stations.update(
        str(value).strip()
        for value in values
        if value is not None
    )

    if len(unique_stations) >= 30:
        break

print("\nSample station IDs:")
for station in sorted(unique_stations)[:30]:
    print(repr(station))

print("\nNumber of unique IDs collected:", len(unique_stations))
