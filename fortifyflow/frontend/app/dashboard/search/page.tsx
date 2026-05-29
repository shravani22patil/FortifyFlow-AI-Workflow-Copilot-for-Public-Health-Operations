"use client";
import { useState } from "react";
import { semanticSearch } from "@/lib/api";

const SUGGESTIONS = [
  "premix testing requirements",
  "non-compliance consequences",
  "stock-out prevention protocol",
  "district officer responsibilities",
  "ISO certification requirements",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await semanticSearch(searchQuery);
      setResults(res.results || []);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: "white", borderBottom: "0.5px solid rgba(0,0,0,0.10)", padding: "12px 24px" }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>Semantic Search</div>
        <div style={{ fontSize: 12, color: "#9a9892" }}>RAG-powered search across all uploaded documents</div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="e.g. What are the testing requirements for premix batches?"
              style={{ flex: 1, padding: "8px 12px", border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 8, fontSize: 13, background: "white", color: "#1a1a18", outline: "none" }}
            />
            <button onClick={() => doSearch()} disabled={loading || !query.trim()} className="btn-primary" style={{ opacity: loading || !query.trim() ? 0.6 : 1 }}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setQuery(s); doSearch(s); }} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, border: "0.5px solid rgba(0,0,0,0.18)", background: "white", color: "#5f5e5a", cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#9a9892", fontSize: 12, padding: "16px 0" }}>
            <div style={{ width: 14, height: 14, border: "2px solid #E1F5EE", borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            Searching across documents…
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {searched && !loading && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              {results.length > 0 ? `${results.length} results for "${query}"` : `No results found for "${query}"`}
            </div>
            {results.length === 0 && (
              <div style={{ color: "#9a9892", fontSize: 12, padding: "12px 0" }}>
                No matching passages found. Try uploading more documents or using different search terms.
              </div>
            )}
            {results.map((r, i) => (
              <div key={i} style={{ background: "white", border: "0.5px solid rgba(0,0,0,0.10)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#FAECE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#993C1D", flexShrink: 0 }}>
                    {r.metadata?.source?.includes(".csv") ? "CSV" : "PDF"}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#1a1a18" }}>
                      Document ID: {r.doc_id.slice(0, 8)}…
                      {r.metadata?.page !== undefined && ` — Page ${r.metadata.page}`}
                    </div>
                    <div style={{ fontSize: 10, color: "#9a9892" }}>
                      Similarity: {(r.similarity * 100).toFixed(0)}%
                      <span style={{ display: "inline-block", width: 48, height: 4, borderRadius: 2, background: "#f5f5f3", marginLeft: 6, verticalAlign: "middle" }}>
                        <span style={{ display: "block", width: `${r.similarity * 100}%`, height: 4, borderRadius: 2, background: r.similarity > 0.8 ? "#1D9E75" : r.similarity > 0.6 ? "#EF9F27" : "#E24B4A" }} />
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#5f5e5a", lineHeight: 1.65, background: "#f5f5f3", borderRadius: 8, padding: "10px 12px" }}>{r.content}</div>
              </div>
            ))}
          </div>
        )}

        {!searched && !loading && (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a18", marginBottom: 4 }}>Search your document library</div>
            <div style={{ fontSize: 12, color: "#9a9892" }}>Uses OpenAI embeddings + ChromaDB to find semantically relevant passages — not just keywords.</div>
          </div>
        )}
      </div>
    </div>
  );
}
