"use client";
import { useEffect, useState } from "react";
import { listDocuments, generateManual, DocumentRecord, ManualResponse } from "@/lib/api";

const OUTPUT_TYPES = [
  { val: "sop", label: "Step-by-step SOP" },
  { val: "beginner_guide", label: "Beginner guide" },
  { val: "checklist", label: "Field officer checklist" },
  { val: "training_outline", label: "Training outline" },
];

export default function ManualsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [docId, setDocId] = useState("");
  const [text, setText] = useState("");
  const [outputType, setOutputType] = useState("sop");
  const [audience, setAudience] = useState("field_officer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManualResponse | null>(null);
  const [useText, setUseText] = useState(false);

  useEffect(() => {
    listDocuments().then(d => { setDocs(d.filter(x => x.status === "complete")); }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await generateManual({
        doc_id: useText ? undefined : docId || undefined,
        workflow_text: useText ? text : undefined,
        output_type: outputType as any,
        audience,
      });
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
        <div style={{ fontSize: 15, fontWeight: 500 }}>Manual Generator</div>
        <div style={{ fontSize: 12, color: "#9a9892" }}>Convert workflows and SOPs into beginner-friendly guides</div>
      </div>

      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, alignItems: "start" }}>
        {/* Config panel */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Configure manual</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>Source</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setUseText(false)} style={{ flex: 1, padding: "6px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: !useText ? "#f5f5f3" : "transparent", color: !useText ? "#1a1a18" : "#5f5e5a" }}>From document</button>
              <button onClick={() => setUseText(true)} style={{ flex: 1, padding: "6px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: useText ? "#f5f5f3" : "transparent", color: useText ? "#1a1a18" : "#5f5e5a" }}>Write workflow</button>
            </div>
          </div>

          {!useText ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>Select document</div>
              <select value={docId} onChange={e => setDocId(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 8, fontSize: 12, background: "white", color: "#1a1a18" }}>
                <option value="">Choose a processed document…</option>
                {docs.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)}
              </select>
              {docs.length === 0 && <div style={{ fontSize: 11, color: "#9a9892", marginTop: 4 }}>No processed documents yet. Upload in Document Intelligence.</div>}
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>Workflow description</div>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Describe your workflow or paste SOP steps here…" style={{ width: "100%", minHeight: 100, padding: "8px 10px", border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 8, fontSize: 12, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, background: "white", color: "#1a1a18" }} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>Output type</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {OUTPUT_TYPES.map(ot => (
                <label key={ot.val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, padding: "6px 8px", borderRadius: 6, background: outputType === ot.val ? "#E1F5EE" : "transparent" }}>
                  <input type="radio" name="outputType" value={ot.val} checked={outputType === ot.val} onChange={() => setOutputType(ot.val)} style={{ accentColor: "#1D9E75" }} />
                  <span style={{ color: outputType === ot.val ? "#0F6E56" : "#1a1a18", fontWeight: outputType === ot.val ? 500 : 400 }}>{ot.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>Audience</div>
            <select value={audience} onChange={e => setAudience(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 8, fontSize: 12, background: "white", color: "#1a1a18" }}>
              <option value="field_officer">Field officer</option>
              <option value="program_manager">Program manager</option>
              <option value="new_hire">New hire / trainee</option>
              <option value="technical_staff">Technical staff</option>
            </select>
          </div>

          <button onClick={handleGenerate} disabled={loading || (!docId && !text)} className="btn-primary" style={{ width: "100%", opacity: loading || (!docId && !text) ? 0.6 : 1 }}>
            {loading ? "Generating…" : "Generate manual"}
          </button>
        </div>

        {/* Output panel */}
        <div className="card" style={{ minHeight: 400 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            {result ? `Generated — ${OUTPUT_TYPES.find(o => o.val === result.output_type)?.label}` : "Output will appear here"}
          </div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#9a9892", fontSize: 12 }}>
              <div style={{ width: 14, height: 14, border: "2px solid #E1F5EE", borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Generating with GPT-4…
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          {result && !loading && (
            <>
              <div style={{ background: "#f5f5f3", borderRadius: 8, padding: "14px 16px", fontSize: 12, color: "#1a1a18", lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 500, overflow: "auto", marginBottom: 12 }}>{result.content}</div>
              <button onClick={() => navigator.clipboard.writeText(result.content)} className="btn-secondary" style={{ fontSize: 12 }}>Copy to clipboard</button>
            </>
          )}
          {!result && !loading && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#9a9892" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 4 }}>Configure and generate</div>
              <div style={{ fontSize: 12 }}>Select a source, choose your output type, and click Generate.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
