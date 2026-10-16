from typing import List, Optional
from pydantic import BaseModel


class ReportMetadata(BaseModel):
    filename: str
    display_name: str
    description: str
    file_type: str
    size_bytes: int
    modified_time: str
    download_url: str


class ReportListResponse(BaseModel):
    reports: List[ReportMetadata]
    total: int
