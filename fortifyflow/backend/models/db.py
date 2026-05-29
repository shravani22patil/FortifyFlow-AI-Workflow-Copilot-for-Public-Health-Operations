import json
import sqlite3
from datetime import datetime
from typing import Optional
from config import get_settings

settings = get_settings()
DB_PATH = "./fortifyflow.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'processing',
            uploaded_at TEXT NOT NULL,
            entities TEXT,
            chunk_count INTEGER,
            error TEXT
        );

        CREATE TABLE IF NOT EXISTS csv_jobs (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'processing',
            created_at TEXT NOT NULL,
            result TEXT
        );
    """)
    conn.commit()
    conn.close()


def save_document_record(doc_id: str, filename: str = None, status: str = "processing",
                          entities: dict = None, chunk_count: int = None, error: str = None):
    conn = get_conn()
    existing = conn.execute("SELECT id FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if existing:
        conn.execute("""
            UPDATE documents SET status=?, entities=?, chunk_count=?, error=?
            WHERE id=?
        """, (status, json.dumps(entities) if entities else None, chunk_count, error, doc_id))
    else:
        conn.execute("""
            INSERT INTO documents (id, filename, file_type, status, uploaded_at)
            VALUES (?, ?, ?, ?, ?)
        """, (doc_id, filename or "", filename.rsplit(".", 1)[-1] if filename else "",
              status, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def get_document_record(doc_id: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("entities"):
        d["entities"] = json.loads(d["entities"])
    return d


def get_all_documents() -> list:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM documents ORDER BY uploaded_at DESC").fetchall()
    conn.close()
    result = []
    for row in rows:
        d = dict(row)
        if d.get("entities"):
            d["entities"] = json.loads(d["entities"])
        result.append(d)
    return result


def save_csv_job(job_id: str, filename: str, result: dict = None, status: str = "processing"):
    conn = get_conn()
    existing = conn.execute("SELECT id FROM csv_jobs WHERE id = ?", (job_id,)).fetchone()
    if existing:
        conn.execute("UPDATE csv_jobs SET status=?, result=? WHERE id=?",
                     (status, json.dumps(result) if result else None, job_id))
    else:
        conn.execute("INSERT INTO csv_jobs (id, filename, status, created_at) VALUES (?,?,?,?)",
                     (job_id, filename, status, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def get_csv_job(job_id: str) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM csv_jobs WHERE id = ?", (job_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("result"):
        d["result"] = json.loads(d["result"])
    return d


init_db()
