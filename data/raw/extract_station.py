
from pathlib import Path
import pyarrow.dataset as ds
import pyarrow.csv as pacsv

# ==========================================
# 1. Configuration
# ==========================================

BASE_DIR = Path(
    r"C:\Users\shrut\Desktop\WeatherGuard\data\raw"
)

INPUT_FILE = BASE_DIR / "2024.parquet"
STATION_ID = "02956"

OUTPUT_FILE = BASE_DIR / f"station_{STATION_ID}.csv"

BATCH_SIZE = 5000


def main():
    # ==========================================
    # 2. Validate input
    # ==========================================

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Parquet file not found:\n{INPUT_FILE}"
        )

    print("Opening Parquet dataset...")

    dataset = ds.dataset(INPUT_FILE, format="parquet")

    if "station" not in dataset.schema.names:
        raise ValueError(
            f"Station column not found. Columns: "
            f"{dataset.schema.names}"
        )

    print("Station column type:", dataset.schema.field("station").type)
    print("Target station:", STATION_ID)

    # ==========================================
    # 3. Create filtered scanner
    # ==========================================

    scanner = dataset.scanner(
        columns=dataset.schema.names,
        filter=ds.field("station") == STATION_ID,
        batch_size=BATCH_SIZE,
        use_threads=False
    )

    # ==========================================
    # 4. Extract batches to CSV
    # ==========================================

    if OUTPUT_FILE.exists():
        OUTPUT_FILE.unlink()

    writer = None
    total_rows = 0

    try:
        for batch in scanner.to_batches():
            if batch.num_rows == 0:
                continue

            if writer is None:
                writer = pacsv.CSVWriter(
                    str(OUTPUT_FILE),
                    batch.schema
                )

            writer.write_batch(batch)
            total_rows += batch.num_rows

            if total_rows % 10000 < batch.num_rows:
                print(f"Extracted rows: {total_rows:,}")

    finally:
        if writer is not None:
            writer.close()

    # ==========================================
    # 5. Verify output
    # ==========================================

    if total_rows == 0:
        if OUTPUT_FILE.exists():
            OUTPUT_FILE.unlink()

        print("\nNo matching rows found.")
        print("Check the station ID and Parquet data.")
        return

    print("\nExtraction successful!")
    print("Station ID:", STATION_ID)
    print(f"Total rows: {total_rows:,}")
    print("Output file:", OUTPUT_FILE)
    print(
        f"CSV size: {OUTPUT_FILE.stat().st_size / (1024 * 1024):.2f} MB"
    )


if __name__ == "__main__":
    main()
