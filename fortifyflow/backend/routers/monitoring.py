import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from services.csv_analytics import CSVAnalyticsService
from models.db import save_csv_job, get_csv_job
from config import get_settings

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])
settings = get_settings()
analytics = CSVAnalyticsService()

os.makedirs(settings.upload_dir, exist_ok=True)


@router.post("/upload")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are supported")

    job_id = str(uuid.uuid4())
    dest = os.path.join(settings.upload_dir, f"{job_id}.csv")

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    save_csv_job(job_id, filename=file.filename, status="processing")
    background_tasks.add_task(_analyze_bg, job_id, dest)

    return {"job_id": job_id, "status": "processing", "filename": file.filename}


async def _analyze_bg(job_id: str, file_path: str):
    try:
        result = analytics.process_csv(file_path)
        save_csv_job(job_id, filename="", result=result, status="complete")
    except Exception as e:
        save_csv_job(job_id, filename="", result={"error": str(e)}, status="error")


@router.get("/{job_id}")
async def get_analysis(job_id: str):
    job = get_csv_job(job_id)
    if not job:
        raise HTTPException(404, "Analysis job not found")
    return job
