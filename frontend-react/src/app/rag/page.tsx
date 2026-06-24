"use client";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { SUGGESTED_RAG_QUERIES } from "@/lib/constants";
import HeroBanner from "@/components/ui/HeroBanner";
import DataTable from "@/components/ui/DataTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { RAGQueryResponse } from "@/types/api";

export default function RAGPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RAGQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleQuery(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    try {
      const res = await apiPost<RAGQueryResponse>("/api/v1/rag/query", { query: q.trim() });
      setResult(res);
    } finally { setLoading(false); }
  }

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="💬 OceanMind RAG Interface"
        description="Ask natural language questions about ocean conditions, fishing zones, marine health, or species data. Powered by <b>LangChain + Llama-3 + FAISS</b> with full <b>provenance tracing</b>."
        gradient="from-[#4a148c] via-[#6a1b9a] to-[#7b1fa2]"
      />

      <div className="mb-6">
        <p className="text-sm text-white/60 mb-3">Try asking:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SUGGESTED_RAG_QUERIES.map((q) => (
            <button key={q} onClick={() => handleQuery(q)}
              className="text-left text-sm px-4 py-2.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 hover:border-[#4fc3f7]/30 transition-all text-white/70 hover:text-white">
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <textarea value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What is the current marine health status near Gujarat?"
          rows={2}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#4fc3f7]/50" />
        <button onClick={() => handleQuery(query)} disabled={!query.trim() || loading}
          className="px-6 bg-[#7b1fa2] hover:bg-[#6a1b9a] text-white rounded-lg font-medium transition-colors disabled:opacity-40 self-end">
          {loading ? "..." : "Ask"}
        </button>
      </div>

      {loading && <LoadingSpinner text="Retrieving from ocean knowledge base..." />}

      {result && !loading && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Answer</h3>
            <p className="text-white/85 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Provenance Citations</h3>
            <DataTable
              columns={[
                { key: "source_id", label: "Source ID" },
                { key: "source_system", label: "System" },
                { key: "quality_flag", label: "Quality" },
                { key: "relevance_score", label: "Relevance" },
              ]}
              data={result.provenance}
              exportFilename="oceanmind_rag_provenance"
            />
          </div>

          <p className="text-xs text-white/40">
            Model: {result.model_used} · Answer ID: {result.answer_id} · {result.timestamp}
          </p>
        </div>
      )}
    </div>
  );
}
