"use client";
import { useEffect, useRef, useState } from "react";
import { uploadDocument, listDocuments, DocumentRecord } from "@/lib/api";

const TABS = ["AI Analysis", "Action Checklist", "All Documents"];

export default function DocumentsPage() {
  const [tab, setTab] = useState(0);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checks, setChecks] = useState<Record<number, boolean>>({ 1: true });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => listDocuments().then(d => { setDocs(d); if (!selected && d.length > 0) setSelected(d[0]); }).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      await uploadDocument(file);
      await load();
    } finally { setUploading(false); }
  };

  const entities = selected?.entities;

  return (
    <div>
      <div style={{ background: "white", borderBottom: "0.5px solid rgba(0,0,0,0.10)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Document Intelligence</div>
          <div style={{ fontSize: 12, color: "#9a9892" }}>{docs.length} documents · {docs.filter(d => d.status === "processing").length} processing</div>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "#1D9E75"; }}
          onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.18)"; }}
          onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.18)"; const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          style={{ border: "1.5px dashed rgba(0,0,0,0.18)", borderRadius: 12, padding: "32px 24px", textAlign: "center", cursor: "pointer", marginBottom: 20, transition: "border-color 0.2s" }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div style={{ fontSize: 24, marginBottom: 8 }}>{uploading ? "⏳" : "📄"}</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18" }}>{uploading ? "Uploading and processing…" : "Drop PDF or DOCX here, or click to upload"}</div>
          <div style={{ fontSize: 12, color: "#9a9892", marginTop: 4 }}>Max 50MB · PDF and DOCX supported</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "none", background: tab === i ? "#f5f5f3" : "transparent", color: tab === i ? "#1a1a18" : "#5f5e5a", transition: "all 0.15s" }}>{t}</button>
          ))}
        </div>

        {/* AI Analysis */}
        {tab === 0 && (
          <div className="card">
            {!selected || !entities ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#9a9892", fontSize: 13 }}>
                {docs.length === 0 ? "Upload a document to see AI analysis" : selected?.status === "processing" ? "⏳ Processing document…" : "Select a document to view analysis"}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{selected.filename}</div>
                <div style={{ fontSize: 11, color: "#9a9892", marginBottom: 12 }}>Analyzed · {selected.chunk_count} chunks</div>
                <div style={{ marginBottom: 12 }}>
                  {entities.risks?.map((r, i) => <span key={i} className="tag tag-risk">{r.slice(0, 40)}</span>)}
                  {entities.key_actions?.slice(0, 2).map((a, i) => <span key={i} className="tag tag-action">{a.slice(0, 35)}</span>)}
                  {entities.deadlines?.map((d, i) => <span key={i} className="tag tag-deadline">{d.date || "Deadline"}</span>)}
                  {entities.stakeholders?.slice(0, 3).map((s, i) => <span key={i} className="tag tag-stakeholder">{s}</span>)}
                </div>
                <div style={{ background: "#f5f5f3", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: "#1D9E75", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>AI SUMMARY</div>
                  <div style={{ fontSize: 12, color: "#5f5e5a", lineHeight: 1.7 }}>{entities.summary}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Checklist */}
        {tab === 1 && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Action items — {selected?.filename || "No document selected"}</div>
            {entities?.key_actions?.length ? entities.key_actions.map((action, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                <div onClick={() => setChecks(c => ({ ...c, [i]: !c[i] }))} style={{ width: 16, height: 16, borderRadius: 4, border: checks[i] ? "none" : "0.5px solid rgba(0,0,0,0.18)", background: checks[i] ? "#1D9E75" : "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
                  {checks[i] ? "✓" : ""}
                </div>
                <div style={{ fontSize: 12, color: checks[i] ? "#9a9892" : "#1a1a18", textDecoration: checks[i] ? "line-through" : "none", lineHeight: 1.5 }}>{action}</div>
              </div>
            )) : <div style={{ color: "#9a9892", fontSize: 12, padding: "16px 0" }}>Upload and analyze a document to generate action items.</div>}
          </div>
        )}

        {/* All Documents */}
        {tab === 2 && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>All documents ({docs.length})</div>
            {docs.length === 0 ? (
              <div style={{ color: "#9a9892", fontSize: 12, padding: "16px 0" }}>No documents uploaded yet.</div>
            ) : docs.map(doc => (
              <div key={doc.id} onClick={() => { setSelected(doc); setTab(0); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)", cursor: "pointer" }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: doc.file_type === "pdf" ? "#FAECE7" : "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: doc.file_type === "pdf" ? "#993C1D" : "#185FA5", flexShrink: 0 }}>
                  {doc.file_type?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.filename}</div>
                  <div style={{ fontSize: 11, color: "#9a9892" }}>{new Date(doc.uploaded_at).toLocaleDateString()} · {doc.chunk_count ? `${doc.chunk_count} chunks` : ""}</div>
                </div>
                <span className={`badge-${doc.status === "complete" ? "processed" : doc.status === "processing" ? "processing" : "error"}`}>
                  {doc.status === "complete" ? "Analyzed" : doc.status === "processing" ? "Processing…" : "Error"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
