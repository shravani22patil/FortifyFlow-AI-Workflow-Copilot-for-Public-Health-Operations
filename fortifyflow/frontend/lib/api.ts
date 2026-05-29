const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// Documents
export const uploadDocument = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return fetch(`${API}/api/documents/upload`, { method: "POST", body: form }).then(r => r.json());
};

export const getDocument = (id: string) =>
  request<DocumentRecord>(`/api/documents/${id}`);

export const listDocuments = () =>
  request<DocumentRecord[]>("/api/documents/");

export const searchDocuments = (query: string, docIds?: string[]) =>
  request<SearchResponse>("/api/documents/search", {
    method: "POST",
    body: JSON.stringify({ query, doc_ids: docIds }),
  });

// Monitoring
export const uploadCSV = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return fetch(`${API}/api/monitoring/upload`, { method: "POST", body: form }).then(r => r.json());
};

export const getCSVAnalysis = (jobId: string) =>
  request<CSVJob>(`/api/monitoring/${jobId}`);

// Manuals
export const generateManual = (body: ManualRequest) =>
  request<ManualResponse>("/api/manuals/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

// Reports
export const generateReport = (body: ReportRequest) =>
  request<ReportResponse>("/api/reports/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

// Semantic search
export const semanticSearch = (query: string, docIds?: string[], topK = 5) =>
  request<SearchResponse>("/api/search/", {
    method: "POST",
    body: JSON.stringify({ query, doc_ids: docIds, top_k: topK }),
  });

// Types
export interface DocumentRecord {
  id: string;
  filename: string;
  file_type: string;
  status: "processing" | "complete" | "error";
  uploaded_at: string;
  entities?: {
    key_actions: string[];
    deadlines: { date: string; description: string }[];
    risks: string[];
    stakeholders: string[];
    summary: string;
  };
  chunk_count?: number;
  error?: string;
}

export interface CSVJob {
  id: string;
  filename: string;
  status: string;
  result?: {
    row_count: number;
    columns_detected: Record<string, any>;
    statistics: Record<string, any>;
    anomalies: any[];
    insights: { title: string; severity: string; body: string; action: string }[];
    preview: any[];
  };
}

export interface ManualRequest {
  doc_id?: string;
  workflow_text?: string;
  output_type: "sop" | "beginner_guide" | "checklist" | "training_outline";
  audience: string;
}

export interface ManualResponse {
  output_type: string;
  audience: string;
  content: string;
  source: string;
}

export interface ReportRequest {
  report_type: "stakeholder" | "donor" | "internal" | "field";
  tone: "formal" | "concise" | "technical";
  doc_ids: string[];
  csv_insights: any[];
  custom_context: string;
}

export interface ReportResponse {
  report: string;
  report_type: string;
  generated_at: string;
}

export interface SearchResponse {
  query: string;
  results: { doc_id: string; content: string; similarity: number; metadata: any }[];
  total?: number;
}
