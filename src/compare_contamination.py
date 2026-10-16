
from pathlib import Path
import pandas as pd
from sklearn.ensemble import IsolationForest

ROOT_DIR = Path(__file__).resolve().parent.parent

train_path = ROOT_DIR / "data" / "processed" / "X_train_scaled.csv"
test_path = ROOT_DIR / "data" / "processed" / "X_test_scaled.csv"

X_train = pd.read_csv(train_path)
X_test = pd.read_csv(test_path)

print("Contamination | Anomalies | Percentage")

for c in [0.05, 0.10, 0.15]:
    model = IsolationForest(
        n_estimators=200,
        contamination=c,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train)
    predictions = model.predict(X_test)

    count = (predictions == -1).sum()
    percentage = count / len(predictions) * 100

    print(f"{c:>13.2f} | {count:>9} | {percentage:.2f}%")
