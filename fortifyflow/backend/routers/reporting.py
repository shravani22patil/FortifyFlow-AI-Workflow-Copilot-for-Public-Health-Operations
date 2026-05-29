from datetime import datetime
from fastapi import APIRouter, HTTPException
from models.schemas import ReportRequest, ReportResponse
from models.db import get_document_record, get_csv_job
from services.llm_service import LLMService

router = APIRouter(prefix="/api/reports", tags=["reports"])
llm_service = LLMService()


@router.post("/generate", response_model=ReportResponse)
async def generate_report(req: ReportRequest):
    doc_summaries = []
    for doc_id in req.doc_ids:
        record = get_document_record(doc_id)
        if record and record.get("status") == "complete":
            entities = record.get("entities", {})
            doc_summaries.append({
                "filename": record.get("filename"),
                "summary": entities.get("summary", ""),
                "key_actions": entities.get("key_actions", []),
                "risks": entities.get("risks", []),
                "deadlines": entities.get("deadlines", []),
                "stakeholders": entities.get("stakeholders", []),
            })

    report = llm_service.generate_report(
        report_type=req.report_type,
        tone=req.tone,
        doc_summaries=doc_summaries,
        csv_insights=req.csv_insights,
        custom_context=req.custom_context
    )

    return ReportResponse(
        report=report,
        report_type=req.report_type,
        generated_at=datetime.utcnow()
    )
