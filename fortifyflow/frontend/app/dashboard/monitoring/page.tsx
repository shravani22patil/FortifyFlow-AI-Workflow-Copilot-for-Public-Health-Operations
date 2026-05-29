"use client";
import { useRef, useState } from "react";
import { uploadCSV, getCSVAnalysis, CSVJob } from "@/lib/api";

const SEV_COLORS: Record<string, string> = { critical: "#E24B4A", warning: "#EF9F27", info: "#185FA5" };
const SEV_BG: Record<string, string> = { critical: "#FCEBEB", warning: "#FAEEDA", info: "#E6F1FB" };
const SEV_TEXT: Record<string, string> = { critical: "#A32D2D", warning: "#854F0B", info: "#185FA5" };

export default function MonitoringPage() {
  const [job, setJob] = useState<CSVJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [polling, setPolling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setJob(null);
    try {
      const { job_id } = await uploadCSV(file);
      setPolling(true);
      // Poll until complete
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const result = await getCSVAnalysis(job_id);
        if (result.status === "complete" || result.status === "error" || attempts > 30) {
          clearInterval(interval);
          setJob(result);
          setPolling(false);
        }
      }, 3000);
    } catch {
      setUploading(false);
    } finally {
      setUploading(false);
    }
  };

  const result = job?.result;
  const insights = result?.insights || [];
  const anomalies = result?.anomalies || [];
  const stats = result?.statistics || {};

  return (
    <div>
      <div style={{ background: "white", borderBottom: "0.5px solid rgba(0,0,0,0.10)", padding: "12px 24px" }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Monitoring Analytics</div>
        <div style={{ fontSize: 12, color: "#9a9892" }}>Upload CSV monitoring data for AI-powered anomaly detection</div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "#1D9E75"; }}
          onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.18)"; }}
          onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.18)"; const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          style={{ border: "1.5px dashed rgba(0,0,0,0.18)", borderRadius: 12, padding: "28px 24px", textAlign: "center", cursor: "pointer", marginBottom: 20, transition: "border-color 0.2s" }}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div style={{ fontSize: 22, marginBottom: 8 }}>{uploading || polling ? "⏳" : "📊"}</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{polling ? "Analyzing data — this takes ~30 seconds…" : uploading ? "Uploading…" : "Drop your CSV monitoring file here"}</div>
          <div style={{ fontSize: 12, color: "#9a9892", marginTop: 4 }}>Auto-detects date, region, and metric columns</div>
        </div>

        {!result && !polling && (
          <div className="card" style={{ textAlign: "center", padding: "40px 24px", color: "#9a9892" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a18", marginBottom: 6 }}>No CSV uploaded yet</div>
            <div style={{ fontSize: 12 }}>Upload a monitoring spreadsheet to detect anomalies and generate insights</div>
          </div>
        )}

        {result && (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Rows analyzed", val: result.row_count },
                { label: "Columns detected", val: Object.keys(result.columns_detected).length },
                { label: "Anomalies flagged", val: anomalies.length },
                { label: "Insights generated", val: insights.length },
              ].map((m, i) => (
                <div key={i} style={{ background: "#f5f5f3", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: "#1a1a18" }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Anomalies */}
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Anomaly detection</div>
                {anomalies.length === 0 ? (
                  <div style={{ color: "#9a9892", fontSize: 12 }}>No anomalies detected — data looks healthy ✓</div>
                ) : anomalies.slice(0, 8).map((a, i) => {
                  const metric = Object.keys(stats.numeric_summary || {})[0];
                  const pct = metric && stats.numeric_summary?.[metric]?.max ? Math.round((a[metric] / stats.numeric_summary[metric].max) * 100) : 50;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                      <div style={{ fontSize: 11, fontWeight: 500, width: 80, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a[Object.keys(a)[0]] || "Row " + i}
                      </div>
                      <div style={{ flex: 1, background: "#f5f5f3", borderRadius: 3, height: 5 }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: 5, borderRadius: 3, background: a.severity === "critical" ? "#E24B4A" : "#EF9F27" }} />
                      </div>
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, fontWeight: 500, background: SEV_BG[a.severity] || "#FAEEDA", color: SEV_TEXT[a.severity] || "#854F0B", flexShrink: 0 }}>
                        {a.severity || "warning"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Stats by region */}
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Statistics by region</div>
                {stats.by_region ? Object.entries(stats.by_region).slice(0, 6).map(([region, val]: [string, any], i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                    <div style={{ fontSize: 11, width: 80, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{region}</div>
                    <div style={{ flex: 1, background: "#f5f5f3", borderRadius: 3, height: 5 }}>
                      <div style={{ width: `${Math.min(val, 100)}%`, height: 5, borderRadius: 3, background: val < 50 ? "#E24B4A" : val < 75 ? "#EF9F27" : "#1D9E75" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#5f5e5a", width: 36, textAlign: "right", flexShrink: 0 }}>{val}</div>
                  </div>
                )) : <div style={{ fontSize: 12, color: "#9a9892" }}>No region column detected in CSV</div>}
              </div>
            </div>

            {/* AI Insights */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>AI-generated insights</div>
              {insights.map((ins, i) => (
                <div key={i} style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: SEV_BG[ins.severity] || "#FAEEDA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: SEV_TEXT[ins.severity] || "#854F0B" }}>
                      {ins.severity === "critical" ? "⚠" : ins.severity === "info" ? "ℹ" : "↘"}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ins.title}</div>
                    <span style={{ marginLeft: "auto", fontSize: 10, padding: "1px 6px", borderRadius: 8, background: SEV_BG[ins.severity] || "#FAEEDA", color: SEV_TEXT[ins.severity] || "#854F0B", fontWeight: 500 }}>{ins.severity}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#5f5e5a", lineHeight: 1.6, marginBottom: 6 }}>{ins.body}</div>
                  {ins.action && <div style={{ fontSize: 11, color: "#0F6E56", fontWeight: 500 }}>→ {ins.action}</div>}
                </div>
              ))}
            </div>

            {/* Data preview */}
            {result.preview?.length > 0 && (
              <div className="card" style={{ marginTop: 16, overflow: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Data preview (first 5 rows)</div>
                <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>{Object.keys(result.preview[0]).map(k => <th key={k} style={{ textAlign: "left", padding: "4px 8px", background: "#f5f5f3", borderRadius: 4, fontWeight: 500, color: "#5f5e5a" }}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i}>{Object.values(row).map((v: any, j) => <td key={j} style={{ padding: "4px 8px", borderBottom: "0.5px solid rgba(0,0,0,0.06)", color: "#1a1a18" }}>{String(v)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
