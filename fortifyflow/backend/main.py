from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import documents, monitoring, manuals, reporting, search

app = FastAPI(
    title="FortifyFlow API",
    description="AI Workflow Copilot for Public Health Operations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(monitoring.router)
app.include_router(manuals.router)
app.include_router(reporting.router)
app.include_router(search.router)

@app.get("/")
def root():
    return {"status": "FortifyFlow API running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
