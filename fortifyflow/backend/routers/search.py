from fastapi import APIRouter, HTTPException
from models.schemas import SearchRequest
from models.db import get_all_documents
from services.document_pipeline import DocumentPipeline

router = APIRouter(prefix="/api/search", tags=["search"])
pipeline = DocumentPipeline()


@router.post("/")
async def semantic_search(req: SearchRequest):
    doc_ids = req.doc_ids
    if not doc_ids:
        all_docs = get_all_documents()
        doc_ids = [d["id"] for d in all_docs if d["status"] == "complete"]

    if not doc_ids:
        return {"query": req.query, "results": [], "message": "No processed documents found"}

    results = pipeline.semantic_search(req.query, doc_ids, top_k=req.top_k)
    return {"query": req.query, "results": results, "total": len(results)}
