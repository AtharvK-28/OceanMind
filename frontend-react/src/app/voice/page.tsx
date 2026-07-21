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

const SUGGESTED = [
  { q: "What does a red zone mean?", lang: "en" },
  { q: "Is it safe to go fishing tomorrow?", lang: "en" },
  { q: "कोच्चि के पास मछली कहाँ है?", lang: "hi" },
  { q: "இன்று மீன்பிடிக்க நல்ல இடம்?", lang: "ta" },
];

export default function VoicePage() {
  const [tab, setTab] = useState("text");
  const [lang, setLang] = useState("hi");
  const { data: langData } = useSWR<{ languages: VoiceLanguage[] }>("/api/v1/voice/languages", fetcher);

  const [query, setQuery] = useState(SAMPLES.hi);
  const [result, setResult] = useState<VoiceQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function changeLang(code: string) { setLang(code); setQuery(SAMPLES[code] ?? ""); }

  async function handleTextQuery(q?: string) {
    const text = q ?? query;
    if (!text.trim()) return;
    setQuery(text);
    setLoading(true);
    try { setResult(await apiPost<VoiceQueryResponse>("/api/v1/voice/query", { text: text.trim(), language: lang, tts_enabled: true })); }
    finally { setLoading(false); }
  }

  async function handleVoiceSim() {
    toast("Microphone input coming soon — use text input for now", "info");
  }

  const langLabel = langData?.languages.find((l) => l.code === lang)?.native ?? lang;

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Bhashini Voice Interface"
        description={'Talk to OceanMind in your own language — no typing, no English required. <span style="opacity:.6">Bhashini ASR → RAG → Bhashini TTS</span>'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main column */}
        <div>
          {/* Language selector pills */}
          <div className="flex gap-2 mb-5">
            {(langData?.languages ?? [{ code: "hi", name: "Hindi", native: "हिन्दी" }, { code: "ta", name: "Tamil", native: "தமிழ்" }, { code: "en", name: "English", native: "English" }]).map((l) => (
              <button key={l.code} onClick={() => changeLang(l.code)}
                className="flex-1 py-3 rounded-xl border text-[13.5px] font-semibold transition-all"
                style={{
                  background: lang === l.code ? "#1f7a8c" : "white",
                  borderColor: lang === l.code ? "#1f7a8c" : "#ece5d6",
                  color: lang === l.code ? "white" : "#46585b",
                }}>
                {l.native}
              </button>
            ))}
          </div>

          <TabGroup tabs={[
            { id: "text", label: "Text Query" },
            { id: "voice", label: "Voice Query" },
          ]} activeTab={tab} onChange={setTab} />

          {tab === "text" && (
            <div className="space-y-4">
              <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={3}
                placeholder="Type in your selected language..."
                className="w-full bg-white border border-card-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-faint resize-none focus:outline-none focus:border-accent/50" />
              <button onClick={() => handleTextQuery()} disabled={!query.trim() || loading}
                className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                <i className="ph ph-paper-plane-tilt" style={{ fontSize: 16 }} />
                {loading ? "Processing..." : "Ask OceanMind"}
              </button>
            </div>
          )}

          {tab === "voice" && (
            <div className="flex flex-col items-center py-8">
              <button onClick={handleVoiceSim} disabled={loading}
                className="w-[100px] h-[100px] rounded-full border-none flex items-center justify-center cursor-pointer text-white"
                style={{ background: "linear-gradient(160deg, #1f7a8c, #15434c)", boxShadow: "0 12px 30px rgba(31,122,140,0.3)" }}>
                <i className="ph-fill ph-microphone" style={{ fontSize: 42 }} />
              </button>
              <div className="mt-4 text-[14px] font-semibold text-text">
                {loading ? "Listening..." : lang === "hi" ? "बोलने के लिए दबाएँ" : lang === "ta" ? "பேச அழுத்தவும்" : "Hold to speak"}
              </div>
              <div className="text-[12px] text-text-muted mt-1">Bhashini · {langLabel}</div>
              <p className="text-[11px] text-text-faint mt-4 text-center max-w-xs">
                Simulates voice input. Production: live Bhashini ASR transcription → RAG → TTS playback.
              </p>
            </div>
          )}

          {/* Suggested questions */}
          {!result && !loading && (
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Try asking</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUGGESTED.map((s, i) => (
                  <button key={i} onClick={() => { changeLang(s.lang); handleTextQuery(s.q); }}
                    className="flex items-center gap-3 bg-white border border-card-border rounded-xl px-4 py-3 text-left hover:border-accent/30 hover:-translate-y-0.5 transition-all"
                    style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
                    <i className="ph ph-chat-circle-dots text-[16px] text-accent" />
                    <span className="text-[13px] text-[#33464a]">{s.q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && <LoadingSpinner text="Processing through Bhashini + RAG pipeline..." />}

          {result && !loading && (
            <div className="mt-6 space-y-5 animate-data-enter">
              {result.query.stt_source !== "text_input" && (
                <p className="text-sm text-text-muted"><i className="ph ph-microphone mr-1" />Transcribed ({langLabel}): <b className="text-text">{result.query.original_text}</b></p>
              )}

              <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 12px 30px rgba(23,48,57,0.04)" }}>
                <div className="flex items-center gap-2 text-[12px] text-text-muted mb-3">
                  <i className="ph-fill ph-sparkle text-[14px] text-[#d98b4a]" />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>OceanMind says</span>
                </div>
                <p className="text-[14px] text-[#33464a] leading-[1.6]">{result.answer.localized}</p>
                {lang !== "en" && (
                  <details className="mt-3">
                    <summary className="text-xs text-text-faint cursor-pointer hover:text-text-muted">English translation</summary>
                    <p className="mt-2 text-[13px] text-text-secondary">{result.answer.english}</p>
                  </details>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <MetricCard label="STT" value={result.pipeline.stt.slice(0, 12)} />
                <MetricCard label="NMT" value={result.pipeline.nmt.slice(0, 12)} />
                <MetricCard label="RAG" value={result.pipeline.rag.slice(0, 12)} />
                <MetricCard label="TTS" value={result.pipeline.tts.slice(0, 12)} />
              </div>

              {result.provenance.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.08em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Provenance</div>
                  <DataTable columns={[
                    { key: "source_id", label: "Source" }, { key: "source_system", label: "System" },
                    { key: "quality_flag", label: "Quality" }, { key: "relevance_score", label: "Relevance" },
                  ]} data={result.provenance} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Pipeline</h3>
            {[
              { icon: "ph ph-microphone", label: "Bhashini ASR", desc: "Speech → Text (HI/TA/EN)", color: "#1f7a8c" },
              { icon: "ph ph-translate", label: "Bhashini NMT", desc: "Translate → English", color: "#1f7a8c" },
              { icon: "ph ph-brain", label: "RAG (Llama-3)", desc: "Retrieve + Generate answer", color: "#3a8c5f" },
              { icon: "ph ph-speaker-high", label: "Bhashini TTS", desc: "English → Voice (HI/TA)", color: "#d49a2e" },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 mb-0">
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: step.color + "15", color: step.color }}>
                    <i className={step.icon} style={{ fontSize: 16 }} />
                  </span>
                  {i < 3 && <div className="w-px h-4 bg-card-border" />}
                </div>
                <div className="pt-0.5 pb-3">
                  <div className="text-[12.5px] font-semibold text-text">{step.label}</div>
                  <div className="text-[11px] text-text-muted">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Languages</h3>
            {[
              { native: "English", code: "EN", status: "Full support" },
              { native: "हिन्दी", code: "HI", status: "STT + TTS" },
              { native: "தமிழ்", code: "TA", status: "STT + TTS" },
            ].map((l) => (
              <div key={l.code} className="flex items-center justify-between py-2 border-t border-[#f0ebdf] first:border-0 text-[12.5px]">
                <span className="text-text">{l.native}</span>
                <span className="text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
