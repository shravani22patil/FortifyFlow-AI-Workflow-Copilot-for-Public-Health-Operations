import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from services.document_pipeline import DocumentPipeline
from models.db import save_document_record, get_document_record, get_all_documents
from config import get_settings

router = APIRouter(prefix="/api/documents", tags=["documents"])
settings = get_settings()
pipeline = DocumentPipeline()

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
}

os.makedirs(settings.upload_dir, exist_ok=True)


@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ["pdf", "docx", "doc"]:
        raise HTTPException(400, "Only PDF and DOCX files are supported")

    doc_id = str(uuid.uuid4())
    dest = os.path.join(settings.upload_dir, f"{doc_id}.{ext}")

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    save_document_record(doc_id, filename=file.filename, status="processing")
    background_tasks.add_task(_process_bg, doc_id, dest, ext)

    return {"doc_id": doc_id, "status": "processing", "filename": file.filename}


async def _process_bg(doc_id: str, file_path: str, file_type: str):
    try:
        entities, chunk_count = pipeline.process_document(file_path, file_type, doc_id)
        save_document_record(doc_id, status="complete", entities=entities, chunk_count=chunk_count)
    except Exception as e:
        save_document_record(doc_id, status="error", error=str(e))


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    record = get_document_record(doc_id)
    if not record:
        raise HTTPException(404, "Document not found")
    return record


@router.get("/")
async def list_documents():
    return get_all_documents()


@router.post("/search")
async def semantic_search(query: str, doc_ids: list[str] = None):
    if not doc_ids:
        all_docs = get_all_documents()
        doc_ids = [d["id"] for d in all_docs if d["status"] == "complete"]
    if not doc_ids:
        return {"query": query, "results": []}
    results = pipeline.semantic_search(query, doc_ids)
    return {"query": query, "results": results}


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    record = get_document_record(doc_id)
    if not record:
        raise HTTPException(404, "Document not found")
    # Remove file
    for ext in ["pdf", "docx", "doc"]:
        path = os.path.join(settings.upload_dir, f"{doc_id}.{ext}")
        if os.path.exists(path):
            os.remove(path)
    return {"deleted": doc_id}
