"use client";
import { useEffect, useState } from "react";
import { listDocuments, DocumentRecord } from "@/lib/api";

const METRICS = [
  { label: "Documents processed", key: "docs", color: "#1D9E75" },
  { label: "Monitoring CSVs", key: "csvs", color: "#185FA5" },
  { label: "Open action items", key: "actions", color: "#854F0B" },
  { label: "Reports generated", key: "reports", color: "#639922" },
];

const ALERTS = [
  { color: "#E24B4A", text: "Iron premix stock critically low in Nashik — 3 days remaining", meta: "Auto-detected · Monitoring CSV · 2h ago" },
  { color: "#EF9F27", text: "SOP compliance rate dropped 8% in UP region (Q1 vs Q2)", meta: "Anomaly detected · 5h ago" },
  { color: "#EF9F27", text: "3 action items from Food Fortification Policy due this week", meta: "Document Intelligence · Policy-2025.pdf" },
  { color: "#639922", text: "Madhya Pradesh reached 94% fortification coverage target", meta: "Auto-tagged · 1d ago" },
];

export default function DashboardPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    listDocuments().then(setDocs).catch(() => {});
  }, []);

  const processed = docs.filter(d => d.status === "complete").length;
  const pending = docs.filter(d => d.status === "processing").length;

  return (
    <div>
      {/* Topbar */}
      <div style={{ background: "white", borderBottom: "0.5px solid rgba(0,0,0,0.10)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a18" }}>Overview</div>
          <div style={{ fontSize: 12, color: "#9a9892" }}>March 2025 — Maharashtra &amp; UP Regions</div>
        </div>
        <a href="/dashboard/documents" style={{ padding: "6px 14px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.18)", background: "white", color: "#1a1a18", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>+ Upload file</a>
        <a href="/dashboard/reporting" style={{ padding: "6px 14px", borderRadius: 8, background: "#1D9E75", color: "white", fontSize: 12, fontWeight: 500, textDecoration: "none" }}>Generate report</a>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Documents processed", val: processed || 47, delta: "↑ 12 this week", up: true },
            { label: "Monitoring CSVs analyzed", val: 18, delta: "↑ 4 new", up: true },
            { label: "Open action items", val: 23, delta: "↓ 6 overdue", up: false },
            { label: "Reports generated", val: 11, delta: "↑ 2 this week", up: true },
          ].map((m, i) => (
            <div key={i} style={{ background: "#f5f5f3", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a18" }}>{m.val}</div>
              <div style={{ fontSize: 11, marginTop: 3, color: m.up ? "#0F6E56" : "#993C1D" }}>{m.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Recent docs */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 12 }}>Recent documents</div>
            {docs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#9a9892", fontSize: 12 }}>
                No documents uploaded yet.<br />
                <a href="/dashboard/documents" style={{ color: "#1D9E75" }}>Upload your first document →</a>
              </div>
            ) : docs.slice(0, 5).map(doc => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: doc.file_type === "pdf" ? "#FAECE7" : "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: doc.file_type === "pdf" ? "#993C1D" : "#185FA5", flexShrink: 0 }}>
                  {doc.file_type?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a18", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.filename}</div>
                  <div style={{ fontSize: 11, color: "#9a9892" }}>{new Date(doc.uploaded_at).toLocaleDateString()}</div>
                </div>
                <span className={`badge-${doc.status === "complete" ? "processed" : doc.status === "processing" ? "processing" : "error"}`}>
                  {doc.status === "complete" ? "Analyzed" : doc.status === "processing" ? "Processing…" : "Error"}
                </span>
              </div>
            ))}
          </div>

          {/* Alerts */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 12 }}>Red flags &amp; alerts</div>
            {ALERTS.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: i < ALERTS.length - 1 ? "0.5px solid rgba(0,0,0,0.08)" : "none", alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, flexShrink: 0, marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 12, color: "#1a1a18", lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: "#9a9892", marginTop: 2 }}>{a.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processing status */}
        {pending > 0 && (
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 14, height: 14, border: "2px solid #E1F5EE", borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: "#1a1a18" }}>{pending} document{pending > 1 ? "s" : ""} currently processing…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
