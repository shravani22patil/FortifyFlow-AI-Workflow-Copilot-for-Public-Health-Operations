from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime


class ExtractedEntities(BaseModel):
    key_actions: List[str] = Field(description="Specific actions the organization must take")
    deadlines: List[dict] = Field(description="List of {date, description} pairs")
    risks: List[str] = Field(description="Identified risks or compliance threats")
    stakeholders: List[str] = Field(description="Organizations or roles mentioned")
    summary: str = Field(description="3-sentence plain-language summary")


class DocumentRecord(BaseModel):
    id: str
    filename: str
    file_type: str
    status: str  # processing | complete | error
    uploaded_at: datetime
    entities: Optional[dict] = None
    chunk_count: Optional[int] = None
    error: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    doc_ids: Optional[List[str]] = None
    top_k: int = 5


class SearchResult(BaseModel):
    doc_id: str
    content: str
    similarity: float
    metadata: dict


class CSVAnalysisResult(BaseModel):
    job_id: str
    filename: str
    row_count: int
    columns_detected: dict
    statistics: dict
    anomalies: List[dict]
    insights: List[dict]
    preview: List[dict]


class ManualRequest(BaseModel):
    doc_id: Optional[str] = None
    workflow_text: Optional[str] = None
    output_type: str = "sop"  # sop | beginner_guide | checklist | training_outline
    audience: str = "field_officer"


class ReportRequest(BaseModel):
    report_type: str  # stakeholder | donor | internal | field
    tone: str = "formal"  # formal | concise | technical
    doc_ids: List[str] = []
    csv_insights: List[dict] = []
    custom_context: str = ""


class ReportResponse(BaseModel):
    report: str
    report_type: str
    generated_at: datetime
