
from pathlib import Path
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

ROOT_DIR = Path(__file__).resolve().parent.parent

TRAIN_FILE = ROOT_DIR / "data" / "processed" / "weather_train.csv"
TEST_FILE = ROOT_DIR / "data" / "processed" / "weather_test.csv"

SCALER_FILE = ROOT_DIR / "models" / "weather_scaler.pkl"
TRAIN_OUTPUT = ROOT_DIR / "data" / "processed" / "X_train_scaled.csv"
TEST_OUTPUT = ROOT_DIR / "data" / "processed" / "X_test_scaled.csv"

FEATURES = [
    "temp",
    "rhum",
    "temp_change",
    "humidity_change",
    "hour",
    "month",
]

# Load split datasets
train_df = pd.read_csv(TRAIN_FILE)
test_df = pd.read_csv(TEST_FILE)

# Use training medians to handle missing values
train_medians = train_df[FEATURES].median()

X_train = train_df[FEATURES].fillna(train_medians)
X_test = test_df[FEATURES].fillna(train_medians)

# Fit scaler ONLY on training data
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)

# Apply the same scaler to test data
X_test_scaled = scaler.transform(X_test)

# Save scaler and scaled features
SCALER_FILE.parent.mkdir(parents=True, exist_ok=True)

joblib.dump(scaler, SCALER_FILE)

pd.DataFrame(
    X_train_scaled, columns=FEATURES
).to_csv(TRAIN_OUTPUT, index=False)

pd.DataFrame(
    X_test_scaled, columns=FEATURES
).to_csv(TEST_OUTPUT, index=False)

print("Feature preparation completed!")
print("Training rows:", len(X_train_scaled))
print("Testing rows:", len(X_test_scaled))
print("Number of features:", len(FEATURES))
print("Scaler saved:", SCALER_FILE)
print("Training features saved:", TRAIN_OUTPUT)
print("Testing features saved:", TEST_OUTPUT)
