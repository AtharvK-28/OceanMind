"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import TabGroup from "@/components/ui/TabGroup";
import DataTable from "@/components/ui/DataTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { VoiceQueryResponse, VoiceLanguage } from "@/types/api";

const SAMPLES: Record<string, string> = {
  hi: "गुजरात के पास समुद्री स्वास्थ्य कैसा है?",
  ta: "குஜராத் அருகே கடல் ஆரோக்கியம் எப்படி?",
  en: "What is the marine health near Gujarat?",
};

export default function VoicePage() {
  const [tab, setTab] = useState("text");
  const [lang, setLang] = useState("hi");
  const { data: langData } = useSWR<{ languages: VoiceLanguage[] }>("/api/v1/voice/languages", fetcher);

  const [query, setQuery] = useState(SAMPLES.hi);
  const [result, setResult] = useState<VoiceQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function changeLang(code: string) {
    setLang(code);
    setQuery(SAMPLES[code] ?? "");
  }

  async function handleTextQuery() {
    if (!query.trim()) return;
    setLoading(true);
    try { setResult(await apiPost<VoiceQueryResponse>("/api/v1/voice/query", { text: query.trim(), language: lang, tts_enabled: true })); }
    finally { setLoading(false); }
  }

  async function handleVoiceSim() {
    setLoading(true);
    try { setResult(await apiPost<VoiceQueryResponse>("/api/v1/voice/query", { audio_base64: "SIMULATED_AUDIO", language: lang, tts_enabled: true })); }
    finally { setLoading(false); }
  }

  const langLabel = langData?.languages.find((l) => l.code === lang)?.native ?? lang;

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Bhashini Voice Interface"
        description="<b>Phase F:</b> Ask OceanMind questions in <b>Hindi</b> or <b>Tamil</b> using voice or text. Pipeline: Bhashini ASR (STT) → RAG → Bhashini TTS."
      />

      <div className="flex items-center gap-4 mb-6">
        <label className="block">
          <span className="text-xs text-text-muted">Language</span>
          <select value={lang} onChange={(e) => changeLang(e.target.value)}
            className="block mt-1 bg-card-hover border border-card-border rounded-lg px-4 py-2 text-sm text-text">
            {(langData?.languages ?? []).map((l) => (
              <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
            ))}
          </select>
        </label>
        <div className="mt-5">
          <MetricCard label="Supported Languages" value={`${langData?.languages.length ?? 0} (MVP)`} />
        </div>
      </div>

      <TabGroup tabs={[
        { id: "text", label: "Text Query" },
        { id: "voice", label: "Voice Query" },
      ]} activeTab={tab} onChange={setTab} />

      {tab === "text" && (
        <div className="space-y-4 max-w-2xl">
          <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={3}
            placeholder="Type in your selected language..."
            className="w-full bg-card-hover border border-card-border rounded-lg px-4 py-3 text-sm text-text placeholder:text-text-faint resize-none focus:outline-none focus:border-accent/50" />
          <button onClick={handleTextQuery} disabled={!query.trim() || loading}
            className="bg-accent hover:bg-accent-dark text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-40">
            {loading ? "Processing..." : "Ask OceanMind"}
          </button>
        </div>
      )}

      {tab === "voice" && (
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-text-muted">
            <b>Production:</b> Record audio → Bhashini ASR transcription → RAG answer → Bhashini TTS playback.<br />
            <b>MVP:</b> Click below to simulate a voice query in {langLabel}.
          </p>
          <button onClick={handleVoiceSim} disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark text-white rounded-lg py-3 font-semibold transition-colors disabled:opacity-50">
            {loading ? "Simulating pipeline..." : "Simulate Voice Query"}
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Processing through Bhashini + RAG pipeline..." />}

      {result && !loading && (
        <div className="mt-6 space-y-6 max-w-2xl">
          {result.query.stt_source !== "text_input" && (
            <p className="text-sm text-text-muted"><i className="ph ph-microphone mr-1" />Transcribed ({langLabel}): <b className="text-text">{result.query.original_text}</b></p>
          )}

          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Answer</h3>
            <p className="text-text leading-relaxed">{result.answer.localized}</p>
            {lang !== "en" && (
              <details className="mt-3">
                <summary className="text-xs text-text-faint cursor-pointer hover:text-text-muted">English translation</summary>
                <p className="mt-2 text-sm text-text-muted">{result.answer.english}</p>
              </details>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="STT" value={result.pipeline.stt.slice(0, 15)} />
            <MetricCard label="NMT" value={result.pipeline.nmt.slice(0, 15)} />
            <MetricCard label="RAG" value={result.pipeline.rag.slice(0, 15)} />
            <MetricCard label="TTS" value={result.pipeline.tts.slice(0, 15)} />
          </div>

          {result.provenance.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Provenance</h3>
              <DataTable columns={[
                { key: "source_id", label: "Source" }, { key: "source_system", label: "System" },
                { key: "quality_flag", label: "Quality" }, { key: "relevance_score", label: "Relevance" },
              ]} data={result.provenance} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
