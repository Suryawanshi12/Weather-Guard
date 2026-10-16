
from pathlib import Path
import pyarrow.parquet as pq
import pyarrow as pa
import pyarrow.csv as pacsv

input_file = Path(
    r"C:\Users\shrut\Desktop\WeatherGuard\data\raw\2024.parquet"
)

output_file = input_file.with_name("weather_2024.csv")

# Read Parquet metadata without loading all data into RAM
parquet_file = pq.ParquetFile(input_file)

print("Total rows:", parquet_file.metadata.num_rows)
print("Total row groups:", parquet_file.num_row_groups)
print("Columns:", parquet_file.schema.names)

if output_file.exists():
    output_file.unlink()

writer = None
rows_written = 0

try:
    for batch in parquet_file.iter_batches(batch_size=5000):
        table = pa.Table.from_batches([batch])

        if writer is None:
            writer = pacsv.CSVWriter(
                str(output_file),
                table.schema
            )

        writer.write_table(table)
        rows_written += table.num_rows

        if rows_written % 50000 == 0:
            print(f"Rows converted: {rows_written:,}")

finally:
    if writer is not None:
        writer.close()

print("Conversion completed!")
print("Rows written:", rows_written)
print("CSV saved at:", output_file)
