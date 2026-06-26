"use client";
import { useState, useEffect, useRef } from "react";
import { apiPost } from "@/lib/api";
import { SUGGESTED_RAG_QUERIES } from "@/lib/constants";
import HeroBanner from "@/components/ui/HeroBanner";
import DataTable from "@/components/ui/DataTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { RAGQueryResponse } from "@/types/api";

const QUERY_ICONS: Record<number, string> = {
  0: "ph ph-map-trifold",
  1: "ph ph-thermometer-simple",
  2: "ph ph-fish",
  3: "ph ph-wave-sine",
  4: "ph ph-warning",
  5: "ph ph-binoculars",
};

export default function RAGPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RAGQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; handleQuery("What is the current marine health status near Gujarat?"); }
  }, []);

  async function handleQuery(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    try {
      setResult(await apiPost<RAGQueryResponse>("/api/v1/rag/query", { query: q.trim() }));
    } finally { setLoading(false); }
  }

  const sources = result ? [...new Set(result.provenance.map((p) => p.source_system))] : [];

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Ask OceanMind"
        description="Ask natural language questions about ocean conditions, fishing zones, marine health, or species data. Powered by <b>LangChain + Llama-3 + FAISS</b> with full <b>provenance tracing</b>."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          {/* Suggested queries as cards */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Try asking</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SUGGESTED_RAG_QUERIES.map((q, i) => (
                <button key={q} onClick={() => handleQuery(q)}
                  className="flex items-start gap-3 text-left bg-white border border-card-border rounded-xl p-4 hover:border-accent/30 hover:-translate-y-0.5 transition-all"
                  style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
                  <span className="w-9 h-9 flex-none rounded-[10px] bg-[#eaf3ef] text-[#2a6f7c] flex items-center justify-center mt-0.5">
                    <i className={QUERY_ICONS[i] ?? "ph ph-chat-circle-dots"} style={{ fontSize: 17 }} />
                  </span>
                  <span className="text-[13.5px] text-[#33464a] leading-snug">{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Query input */}
          <div className="flex gap-3">
            <textarea value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What is the current marine health status near Gujarat?"
              rows={2}
              className="flex-1 bg-white border border-card-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-faint resize-none focus:outline-none focus:border-accent/50" />
            <button onClick={() => handleQuery(query)} disabled={!query.trim() || loading}
              className="px-6 bg-accent hover:bg-accent-dark text-white rounded-xl font-semibold transition-colors disabled:opacity-40 self-end flex items-center gap-2">
              <i className="ph ph-paper-plane-tilt" style={{ fontSize: 16 }} />
              {loading ? "..." : "Ask"}
            </button>
          </div>

          {loading && <LoadingSpinner text="Retrieving from ocean knowledge base..." />}

          {/* Answer card */}
          {result && !loading && (
            <div className="space-y-5 animate-data-enter">
              <div className="bg-white border border-card-border rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 12px 30px rgba(23,48,57,0.04)" }}>
                <div className="flex items-center gap-2 text-[12px] text-text-muted mb-4">
                  <i className="ph-fill ph-sparkle text-[14px] text-[#d98b4a]" />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>OceanMind says</span>
                </div>
                <p className="text-[14px] text-[#33464a] leading-[1.65] whitespace-pre-wrap">{result.answer}</p>

                {sources.length > 0 && (
                  <div className="flex gap-2 mt-5 flex-wrap">
                    {sources.map((s) => (
                      <span key={s} className="text-[9.5px] px-[9px] py-1 rounded-[7px] bg-card-hover border border-card-border text-text-muted"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Provenance */}
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Provenance citations</h3>
                <DataTable
                  columns={[
                    { key: "source_id", label: "Source" },
                    { key: "source_system", label: "System" },
                    { key: "quality_flag", label: "Quality" },
                    { key: "relevance_score", label: "Relevance" },
                  ]}
                  data={result.provenance}
                  exportFilename="oceanmind_rag_provenance"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Knowledge base</h3>
            {[
              { icon: "ph ph-brain", label: "LLM", value: "Llama-3 8B" },
              { icon: "ph ph-database", label: "Vector store", value: "FAISS" },
              { icon: "ph ph-link-simple", label: "Embeddings", value: "all-MiniLM-L6" },
              { icon: "ph ph-shield-check", label: "Provenance", value: "Full tracing" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-2.5 border-t border-[#f0ebdf] first:border-0">
                <i className={`${item.icon} text-[16px] text-[#2a6f7c]`} />
                <div className="flex-1">
                  <div className="text-[12px] text-text-muted">{item.label}</div>
                  <div className="text-[13px] font-semibold text-text">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Data sources</h3>
            {[
              { name: "INCOIS", desc: "SST, Chlorophyll, PFZ advisories" },
              { name: "CMFRI", desc: "Fish catch statistics, species data" },
              { name: "ARGO", desc: "Ocean profiles, T/S/O2" },
              { name: "GFW", desc: "AIS fishing vessel tracking" },
              { name: "WoRMS", desc: "Species taxonomy, AphiaIDs" },
            ].map((src) => (
              <div key={src.name} className="flex items-center gap-3 py-2 border-t border-[#f0ebdf] first:border-0">
                <span className="w-[34px] h-[22px] flex-none rounded-[5px] bg-card-hover text-[9px] font-medium text-text-muted flex items-center justify-center" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{src.name}</span>
                <span className="text-[12px] text-text-secondary">{src.desc}</span>
              </div>
            ))}
          </div>

          {result && (
            <div className="bg-card-hover border border-card-border rounded-xl px-4 py-3 text-[10px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Model: {result.model_used}<br />
              Answer: {result.answer_id}<br />
              {result.timestamp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
