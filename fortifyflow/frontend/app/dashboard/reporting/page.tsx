"use client";
import { useEffect, useState } from "react";
import { listDocuments, generateReport, DocumentRecord, ReportResponse } from "@/lib/api";

const REPORT_TYPES = ["stakeholder", "donor", "internal", "field"];
const TONES = ["formal", "concise", "technical"];

export default function ReportingPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [reportType, setReportType] = useState("stakeholder");
  const [tone, setTone] = useState("formal");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResponse | null>(null);

  useEffect(() => {
    listDocuments().then(d => setDocs(d.filter(x => x.status === "complete"))).catch(() => {});
  }, []);

  const toggleDoc = (id: string) =>
    setSelectedDocs(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await generateReport({ report_type: reportType as any, tone: tone as any, doc_ids: selectedDocs, csv_insights: [], custom_context: context });
      setResult(res);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: "white", borderBottom: "0.5px solid rgba(0,0,0,0.10)", padding: "12px 24px" }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Reporting Assistant</div>
        <div style={{ fontSize: 12, color: "#9a9892" }}>Generate stakeholder updates, donor reports, and internal summaries</div>
      </div>

      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
        {/* Config */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Configure report</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Report type</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {REPORT_TYPES.map(t => (
                <button key={t} onClick={() => setReportType(t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid", borderColor: reportType === t ? "#1D9E75" : "rgba(0,0,0,0.18)", background: reportType === t ? "#E1F5EE" : "white", color: reportType === t ? "#0F6E56" : "#1a1a18", fontWeight: reportType === t ? 500 : 400, textTransform: "capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tone</div>
            <div style={{ display: "flex", gap: 4 }}>
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)} style={{ flex: 1, padding: "5px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid", borderColor: tone === t ? "#1D9E75" : "rgba(0,0,0,0.18)", background: tone === t ? "#E1F5EE" : "white", color: tone === t ? "#0F6E56" : "#1a1a18", fontWeight: tone === t ? 500 : 400, textTransform: "capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data sources</div>
            {docs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#9a9892" }}>No documents available. Upload in Document Intelligence first.</div>
            ) : docs.map(d => (
              <label key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, padding: "5px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                <input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={() => toggleDoc(d.id)} style={{ accentColor: "#1D9E75" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1a1a18" }}>{d.filename}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Custom context</div>
            <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. Include Nashik supply issue, highlight Q2 targets…" style={{ width: "100%", minHeight: 72, padding: "8px 10px", border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 8, fontSize: 12, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, background: "white", color: "#1a1a18" }} />
          </div>

          <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ width: "100%", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Generating…" : "Generate report"}
          </button>
        </div>

        {/* Output */}
        <div className="card" style={{ minHeight: 400 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            {result ? `${result.report_type.charAt(0).toUpperCase() + result.report_type.slice(1)} report — ${new Date(result.generated_at).toLocaleString()}` : "Report preview"}
          </div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#9a9892", fontSize: 12 }}>
              <div style={{ width: 14, height: 14, border: "2px solid #E1F5EE", borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Writing report with GPT-4…
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {result && !loading && (
            <>
              <div style={{ fontSize: 12, color: "#1a1a18", lineHeight: 1.85, whiteSpace: "pre-wrap", maxHeight: 520, overflow: "auto", marginBottom: 12, background: "#f5f5f3", borderRadius: 8, padding: "14px 16px" }}>{result.report}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigator.clipboard.writeText(result.report)} className="btn-secondary" style={{ fontSize: 12 }}>Copy text</button>
              </div>
            </>
          )}
          {!result && !loading && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#9a9892" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📝</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 4 }}>Configure and generate</div>
              <div style={{ fontSize: 12 }}>Select report type, tone, and data sources. The AI will synthesize everything into a polished report.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
