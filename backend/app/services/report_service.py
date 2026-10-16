from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.schemas.report import ReportMetadata, ReportListResponse


REPORT_DESCRIPTIONS = {
    "anomaly_predictions_05.csv": {
        "display_name": "Test Set Anomaly Predictions (5% Contamination)",
        "description": "Full chronological test set (1,555 hourly records) with Isolation Forest predictions, decision scores, and status classifications.",
        "type": "CSV Dataset",
    },
    "model_evaluation.txt": {
        "display_name": "Model Evaluation Report",
        "description": "Comprehensive evaluation summary documenting training/test splits, prediction distribution, score quartiles, synthetic metrics, and real-world limitations.",
        "type": "Text Report",
    },
    "synthetic_model_evaluation.txt": {
        "display_name": "Synthetic Evaluation Benchmark Report",
        "description": "Experimental evaluation report documenting sensitivity, precision, recall, and confusion matrix against 77 injected synthetic anomalies.",
        "type": "Text Report",
    },
    "station_02956_clean.csv": {
        "display_name": "Clean Station 02956 Historical Dataset",
        "description": "Full cleaned chronological observational record (7,775 rows) for weather station 02956 across the year 2024.",
        "type": "CSV Dataset",
    },
    "weather_train.csv": {
        "display_name": "Training Set (80% Chronological Split)",
        "description": "Baseline training dataset consisting of 6,220 chronological hourly records (Jan 1, 2024 - Oct 1, 2024).",
        "type": "CSV Dataset",
    },
    "weather_test.csv": {
        "display_name": "Test Set (20% Chronological Split)",
        "description": "Holdout test dataset consisting of 1,555 chronological hourly records (Oct 1, 2024 - Dec 31, 2024).",
        "type": "CSV Dataset",
    },
}


class ReportService:
    def _find_report_file(self, filename: str) -> Optional[Path]:
        # Strictly check against permitted list
        if filename not in settings.PERMITTED_REPORTS:
            return None

        # Check in reports directory first, then data/processed
        candidate1 = settings.REPORTS_DIR / filename
        if candidate1.exists() and candidate1.is_file():
            return candidate1

        candidate2 = settings.DATA_PROCESSED_DIR / filename
        if candidate2.exists() and candidate2.is_file():
            return candidate2

        return None

    def list_reports(self) -> ReportListResponse:
        reports: List[ReportMetadata] = []
        for filename in settings.PERMITTED_REPORTS:
            file_path = self._find_report_file(filename)
            if file_path is not None:
                meta = REPORT_DESCRIPTIONS.get(filename, {
                    "display_name": filename,
                    "description": "WeatherGuard analysis artifact",
                    "type": "Document",
                })
                stat = file_path.stat()
                mtime_str = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

                reports.append(
                    ReportMetadata(
                        filename=filename,
                        display_name=meta["display_name"],
                        description=meta["description"],
                        file_type=meta["type"],
                        size_bytes=stat.st_size,
                        modified_time=mtime_str,
                        download_url=f"/api/reports/{filename}/download",
                    )
                )

        return ReportListResponse(reports=reports, total=len(reports))

    def get_report_path_and_mime(self, filename: str) -> Tuple[Path, str]:
        # Validate against strict permitted whitelist
        if filename not in settings.PERMITTED_REPORTS:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied: '{filename}' is not in the permitted download list."
            )

        file_path = self._find_report_file(filename)
        if file_path is None or not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Report file '{filename}' was not found on the server."
            )

        if filename.endswith(".csv"):
            mime_type = "text/csv"
        elif filename.endswith(".txt"):
            mime_type = "text/plain"
        elif filename.endswith(".json"):
            mime_type = "application/json"
        else:
            mime_type = "application/octet-stream"

        return file_path, mime_type


report_service = ReportService()
