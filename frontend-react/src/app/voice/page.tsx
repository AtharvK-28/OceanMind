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
        title="🗣️ Bhashini Voice Interface"
        description="<b>Phase F:</b> Ask OceanMind questions in <b>Hindi</b> or <b>Tamil</b> using voice or text. Pipeline: Bhashini ASR (STT) → RAG → Bhashini TTS."
        gradient="from-[#0d47a1] via-[#1565c0] to-[#1976d2]"
      />

      <div className="flex items-center gap-4 mb-6">
        <label className="block">
          <span className="text-xs text-white/50">Language</span>
          <select value={lang} onChange={(e) => changeLang(e.target.value)}
            className="block mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white">
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
        { id: "text", label: "⌨️ Text Query" },
        { id: "voice", label: "🎤 Voice Query" },
      ]} activeTab={tab} onChange={setTab} />

      {tab === "text" && (
        <div className="space-y-4 max-w-2xl">
          <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={3}
            placeholder="Type in your selected language..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-[#4fc3f7]/50" />
          <button onClick={handleTextQuery} disabled={!query.trim() || loading}
            className="bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-40">
            {loading ? "Processing..." : "🔍 Ask OceanMind"}
          </button>
        </div>
      )}

      {tab === "voice" && (
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-white/60">
            <b>Production:</b> Record audio → Bhashini ASR transcription → RAG answer → Bhashini TTS playback.<br />
            <b>MVP:</b> Click below to simulate a voice query in {langLabel}.
          </p>
          <button onClick={handleVoiceSim} disabled={loading}
            className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-lg py-3 font-semibold transition-colors disabled:opacity-50">
            {loading ? "Simulating pipeline..." : "🎤 Simulate Voice Query"}
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Processing through Bhashini + RAG pipeline..." />}

      {result && !loading && (
        <div className="mt-6 space-y-6 max-w-2xl">
          {result.query.stt_source !== "text_input" && (
            <p className="text-sm text-white/70">🎤 Transcribed ({langLabel}): <b className="text-white">{result.query.original_text}</b></p>
          )}

          <div className="bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">Answer</h3>
            <p className="text-white/85 leading-relaxed">{result.answer.localized}</p>
            {lang !== "en" && (
              <details className="mt-3">
                <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">English translation</summary>
                <p className="mt-2 text-sm text-white/60">{result.answer.english}</p>
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
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Provenance</h3>
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
