from fastapi import APIRouter
from fastapi.responses import FileResponse
from backend.app.schemas.report import ReportListResponse
from backend.app.services.report_service import report_service

router = APIRouter(tags=["Reports & Downloads"])


@router.get("/reports", response_model=ReportListResponse)
def list_available_reports():
    """List available project reports and data exports with metadata and download URLs."""
    return report_service.list_reports()


@router.get("/reports/{report_name}/download")
def download_report(report_name: str):
    """
    Download an authorized project report or dataset artifact.
    Access is strictly restricted to pre-approved files to prevent unauthorized filesystem access.
    """
    file_path, mime_type = report_service.get_report_path_and_mime(report_name)
    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=file_path.name,
    )
