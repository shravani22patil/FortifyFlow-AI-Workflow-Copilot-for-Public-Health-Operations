from fastapi import APIRouter, HTTPException
from models.schemas import ManualRequest
from models.db import get_document_record
from services.llm_service import LLMService

router = APIRouter(prefix="/api/manuals", tags=["manuals"])
llm_service = LLMService()


@router.post("/generate")
async def generate_manual(req: ManualRequest):
    source_text = ""

    if req.doc_id:
        record = get_document_record(req.doc_id)
        if not record:
            raise HTTPException(404, "Document not found")
        if record.get("status") != "complete":
            raise HTTPException(400, "Document not yet processed")
        entities = record.get("entities", {})
        source_text = f"""
Document: {record.get('filename')}
Summary: {entities.get('summary', '')}
Key Actions: {entities.get('key_actions', [])}
Risks: {entities.get('risks', [])}
"""
    elif req.workflow_text:
        source_text = req.workflow_text
    else:
        raise HTTPException(400, "Provide either doc_id or workflow_text")

    output = llm_service.generate_manual(req.output_type, source_text, req.audience)
    return {
        "output_type": req.output_type,
        "audience": req.audience,
        "content": output,
        "source": "document" if req.doc_id else "text"
    }
