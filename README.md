<div align="center">

<img src="https://img.shields.io/badge/FortifyFlow-AI%20Workflow%20Copilot-1D9E75?style=for-the-badge&logo=leaflet&logoColor=white" alt="FortifyFlow"/>

# FortifyFlow — AI Workflow Copilot for Public Health Operations

**An internal AI tool that automates document processing, monitoring analytics, and reporting workflows for food fortification programs — eliminating 60%+ of manual knowledge work.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=flat-square&logo=chainlink&logoColor=white)](https://langchain.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6B35?style=flat-square)](https://trychroma.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Data Flow](#-data-flow) · [API Reference](#-api-reference) · [Deployment](#-deployment)

---

![FortifyFlow Dashboard Preview](https://via.placeholder.com/900x480/1D9E75/ffffff?text=FortifyFlow+Dashboard+Preview)

</div>

---

## 🧩 Problem Statement

Organizations running food fortification programs — like monitoring iron and vitamin levels in wheat flour across hundreds of districts — spend the majority of their time on **manual, repetitive knowledge work**:

- Reading 40-page government policy PDFs to extract deadlines and compliance obligations
- Scanning thousands-of-row monitoring CSVs to find districts with supply issues
- Writing the same stakeholder or donor report by hand every quarter
- Onboarding field officers from scratch on complex SOPs

**FortifyFlow solves all four with a single, integrated AI platform.**

---

## ✨ Features

### 📄 Document Intelligence Module
- Upload PDF or DOCX files (policy documents, SOPs, audit reports)
- LLM-powered extraction of **key actions, deadlines, risks, and stakeholders** using Pydantic-enforced structured outputs
- Auto-generated **action checklists** with due dates and owners
- Semantic tagging of content by category (Risk / Action / Deadline / Stakeholder)

### 📊 Monitoring Analytics Module
- Upload CSV monitoring data — auto-detects column roles (date, region, metric, status)
- **Z-score anomaly detection** (SciPy) per district/region group — flags critical outliers
- AI-generated plain-language insights with root cause hypotheses and recommended actions
- Data validation and null-value cleaning before analysis

### 📋 Manual Generator
- Convert uploaded SOPs or workflow descriptions into **step-by-step field guides**
- Configurable output format: SOP, beginner guide, field checklist, training outline
- Beginner-friendly language, jargon definitions, numbered steps

### 📝 Reporting Assistant
- Multi-source synthesis — pulls from uploaded documents + CSV insights simultaneously
- Generate **stakeholder updates, donor reports, internal summaries, and field briefings**
- Configurable tone (formal, concise, technical) and audience-specific framing

### 🔍 Semantic Search (RAG)
- Search across your entire uploaded document library by meaning, not keyword
- ChromaDB + OpenAI embeddings with **cosine similarity ranking**
- Returns passages with source document, page number, and similarity score
- Synthesize results from multiple documents in a single AI response

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
│   Dashboard · Document Intelligence · Monitoring · Search       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP / REST
┌──────────────────────────────▼──────────────────────────────────┐
│                       BACKEND (FastAPI)                         │
│    /documents  /monitoring  /manuals  /reports  /search         │
└────────┬──────────────┬──────────────┬──────────────────────────┘
         │              │              │
┌────────▼───┐  ┌───────▼──────┐  ┌───▼──────────────────────────┐
│  Document  │  │ CSV Analytics│  │      RAG Service              │
│  Pipeline  │  │   Service    │  │  (ChromaDB + Embeddings)      │
│ LangChain  │  │Pandas/SciPy  │  │  Semantic Search              │
│  GPT-4     │  │  GPT-4       │  │  GPT-4 Synthesis             │
└────────────┘  └──────────────┘  └──────────────────────────────┘
         │              │              │
┌────────▼──────────────▼──────────────▼──────────────────────────┐
│                         DATA LAYER                              │
│   PostgreSQL (metadata)  ·  ChromaDB (vectors)  ·  Supabase    │
│                   Storage (raw files)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles
- **Separation of concerns** — frontend, backend API, AI services, and data stores are fully decoupled
- **Async-first** — all AI processing runs as background tasks; uploads return immediately
- **Modular AI services** — document pipeline, CSV analytics, and RAG are independent services that can be upgraded individually
- **Structured outputs** — Pydantic schemas enforce LLM response format, eliminating hallucination-caused failures

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) | Server components, streaming, file-based routing |
| **Styling** | Tailwind CSS + ShadCN UI | Utility-first, production-grade component library |
| **Backend** | FastAPI (Python 3.11) | Async-native, Pydantic integration, Python AI ecosystem |
| **LLM** | OpenAI GPT-4 Turbo | Best structured output reliability for extraction tasks |
| **AI Framework** | LangChain 0.2 | Document loaders, text splitters, embedding pipelines |
| **Vector Store** | ChromaDB | Self-hosted, no API key, persist-to-disk |
| **Data Analysis** | Pandas + SciPy | Industry standard for CSV processing + z-score anomaly detection |
| **Database** | Supabase (PostgreSQL) | Managed Postgres + file storage + auth in one |
| **Output Validation** | Pydantic v2 | Enforces structured LLM outputs — zero schema failures |

---

## 📁 Folder Structure

```
fortifyflow/
├── frontend/                        # Next.js 15 App Router
│   ├── app/
│   │   ├── dashboard/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── monitoring/page.tsx
│   │   ├── manuals/page.tsx
│   │   ├── reporting/page.tsx
│   │   └── search/page.tsx
│   ├── components/
│   │   ├── ui/                      # ShadCN components
│   │   ├── FileUpload.tsx
│   │   ├── InsightCard.tsx
│   │   ├── ActionChecklist.tsx
│   │   └── ComplianceChart.tsx
│   └── lib/
│       └── api.ts                   # Typed API client
│
├── backend/                         # FastAPI Python server
│   ├── main.py                      # App entry point + CORS
│   ├── routers/
│   │   ├── documents.py             # Upload, extract, analyze
│   │   ├── monitoring.py            # CSV processing, anomalies
│   │   ├── manuals.py               # SOP generation
│   │   ├── reporting.py             # Report generation
│   │   └── search.py                # Semantic search (RAG)
│   ├── services/
│   │   ├── document_pipeline.py     # LangChain extraction pipeline
│   │   ├── csv_analytics.py         # Pandas + anomaly detection
│   │   ├── rag_service.py           # ChromaDB retrieval
│   │   └── llm_service.py           # OpenAI wrapper
│   ├── models/
│   │   ├── schemas.py               # Pydantic request/response models
│   │   └── db.py                    # SQLAlchemy ORM models
│   └── config.py                    # Settings via pydantic-settings
│
├── vector_store/                    # ChromaDB persistent storage
├── uploads/                         # Temporary file storage
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔄 Data Flow

### PDF / DOCX Document

```
Upload (PDF/DOCX)
    │
    ▼
FastAPI /upload ──► Save to Supabase Storage ──► Create DB record (status: processing)
    │
    ▼ (background task)
LangChain PDFLoader / Docx2txtLoader
    │
    ▼
RecursiveCharacterTextSplitter
  chunk_size=1000, overlap=200
    │
    ▼
OpenAI Embeddings API ──► ChromaDB (persist vectors per doc_id)
    │
    ▼
GPT-4 Turbo + Extraction Prompt
  → Pydantic parser (ExtractedEntities schema)
    │
    ▼
PostgreSQL: save {actions, risks, deadlines, stakeholders, summary}
    │
    ▼
Frontend polls status → renders insight cards + checklist
```

### CSV Monitoring Data

```
Upload (CSV)
    │
    ▼
Pandas read_csv ──► Clean (drop nulls, strip headers)
    │
    ▼
Auto-detect column roles (date / region / metric)
    │
    ▼
SciPy z-score per group ──► Flag rows where |z| > 2.5
    │
    ▼
Generate statistics summary (mean, std, min, max by region)
    │
    ▼
GPT-4: statistics + anomalies ──► JSON insights
  [{title, severity, body, action}]
    │
    ▼
Frontend: charts + insight cards + anomaly table
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key
- Supabase project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/shravani22patil/fortifyflow.git
cd fortifyflow
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt

# Copy and fill in your environment variables
cp .env.example .env
```

**`.env` (backend):**
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...
DATABASE_URL=postgresql://user:password@host:5432/fortifyflow
CHROMA_PERSIST_DIR=./vector_store
UPLOAD_DIR=./uploads
```

```bash
# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install

# Set the backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

App available at: `http://localhost:3000`

### 4. Docker (recommended for full stack)

```bash
# From project root
docker-compose up --build
```

`docker-compose.yml` starts backend, frontend, and ChromaDB together.

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload PDF or DOCX for processing |
| `GET` | `/api/documents/{doc_id}/analysis` | Get extracted entities + summary |
| `POST` | `/api/documents/search` | Semantic search across documents |
| `POST` | `/api/monitoring/analyze` | Upload + analyze CSV |
| `GET` | `/api/monitoring/{job_id}/results` | Get anomalies + insights |
| `POST` | `/api/manuals/generate` | Generate SOP or guide |
| `POST` | `/api/reports/generate` | Generate stakeholder report |

Full interactive API documentation: `/docs` (Swagger UI) or `/redoc`

---

## ☁️ Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set environment variable in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend → Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Set root directory to `/backend`
3. Add environment variables from `.env`
4. Railway auto-detects FastAPI via `Procfile`:

```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Vector store persistence

Mount a Railway volume at `./vector_store` to persist ChromaDB embeddings across deploys.

---

## 🔮 Roadmap

- [ ] Human-in-the-loop review for extracted action items
- [ ] Multi-language document support (Hindi, Marathi)
- [ ] Role-based access control (program manager / field officer)
- [ ] Supabase Auth integration
- [ ] Scheduled report generation (cron-based)
- [ ] Migrate to LlamaIndex for cleaner RAG abstractions
- [ ] Open-source LLM support (Llama 3 / Mixtral via Ollama)
- [ ] Export reports to PDF and DOCX

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Commit with a clear message
git commit -m "feat: add semantic search filtering by date range"

# Push and open a PR
git push origin feature/your-feature-name
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built by [Shravani Patil](https://linkedin.com/in/shravanipatil) · [GitHub](https://github.com/shravani22patil)

*FortifyFlow is an open-source project. Not affiliated with Fortify Health.*

</div>
