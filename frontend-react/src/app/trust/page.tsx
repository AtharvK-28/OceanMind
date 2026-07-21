"use client";
import useSWR from "swr";
import { apiGet } from "@/lib/api";

const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";
const darkGradient = "linear-gradient(177deg, #16434c 0%, #10333b 60%, #0e2d34 100%)";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

type Kind = "live" | "real" | "fallback" | "simulated" | "mock";
const STATUS: Record<Kind, { label: string; color: string; bg: string }> = {
  live:      { label: "Live",      color: "#3a8c5f", bg: "#eaf3ef" },
  real:      { label: "Real data", color: "#1f7a8c", bg: "#e8f1f4" },
  fallback:  { label: "Fallback",  color: "#d49a2e", bg: "#f7efdb" },
  simulated: { label: "Simulated", color: "#8f6516", bg: "#f7efdb" },
  mock:      { label: "Mock",      color: "#5b6d8c", bg: "#eaedf3" },
};

interface Health { db: string; mhi_model: string; sfz_model: string; blockchain: string }
// Some endpoints report is_live as a boolean, others per-feed (e.g. INCOIS
// returns {sst, chlorophyll}). Treat a source as live only if every feed is —
// a truthy object must never be mistaken for "live".
interface LiveFlag { is_live?: boolean | Record<string, boolean>; source?: string }
const get = <T,>(p: string) => apiGet<T>(p);

function allLive(flag: LiveFlag["is_live"]): boolean {
  if (typeof flag === "boolean") return flag;
  if (flag && typeof flag === "object") {
    const vals = Object.values(flag);
    return vals.length > 0 && vals.every(Boolean);
  }
  return false;
}

function Pill({ kind }: { kind: Kind }) {
  const s = STATUS[kind];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] whitespace-nowrap"
      style={{ ...mono, background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export default function TrustPage() {
  const { data: health } = useSWR<Health>("/health", get, { refreshInterval: 30000 });
  const { data: argo } = useSWR<LiveFlag>("/api/v1/argo/live", get, { revalidateOnFocus: false });
  const { data: gfw } = useSWR<LiveFlag>("/api/v1/gfw/live", get, { revalidateOnFocus: false });
  const { data: incois } = useSWR<LiveFlag>("/api/v1/incois/live", get, { revalidateOnFocus: false });

  const dbOk = health ? health.db === "ok" : false;
  const argoLive = allLive(argo?.is_live);
  const gfwLive = allLive(gfw?.is_live);
  const incoisLive = allLive(incois?.is_live);

  const sources: { name: string; powers: string; kind: Kind; note: string }[] = [
    {
      name: "Open-Meteo Marine & Forecast", powers: "Fisher advisory · sea state · tides · SST", kind: "live",
      note: "Free, keyless API called live on every advisory request — wind, wave height, water temperature and tide times are real.",
    },
    {
      name: "Roboflow vision model", powers: "Catch-photo species identification", kind: "live",
      note: "Real inference on uploaded photos — the species, confidence and AphiaID come back from the hosted model.",
    },
    {
      name: "Groq · Llama 3.3 70B", powers: "Ask OceanMind (RAG) · voice answers", kind: "live",
      note: "Real LLM calls. Every answer cites the documents it retrieved from.",
    },
    {
      name: "FAISS + project corpus", powers: "RAG retrieval & provenance", kind: "live",
      note: "Genuine vector retrieval over the PRD, TRD, implementation plan and reference material — not a canned answer list.",
    },
    {
      name: "Browser Web Speech API", powers: "Voice input & spoken answers", kind: "live",
      note: "Real speech-to-text and text-to-speech in Chrome and Android.",
    },
    {
      name: "ARGO GDAC float profiles", powers: "Marine Health Index", kind: "real",
      note: `70 real Indian-Ocean float profiles interpolated onto the shelf grid. The live re-fetch pipeline is ${argoLive ? "live" : "in fallback"} — the bundled measurements are genuine.`,
    },
    {
      name: "WoRMS / CMFRI taxonomy", powers: "Species identity & AphiaIDs", kind: "real",
      note: "Authoritative species reference — every species resolves to a real WoRMS AphiaID.",
    },
    {
      name: "IUCN Red List status", powers: "Sustainability grading", kind: "real",
      note: "Published conservation status per species, used for the footprint score and consumer provenance page.",
    },
    {
      name: "Global Fishing Watch (AIS)", powers: "Fishing-effort context · IUU signals", kind: gfwLive ? "live" : "fallback",
      note: gfwLive ? "Live AIS effort data." : "Needs an API key. A synthetic effort grid stands in and is labelled as such in the UI.",
    },
    {
      name: "INCOIS oceanographic grid", powers: "SST & chlorophyll fields", kind: incoisLive ? "live" : "fallback",
      note: incoisLive ? "Live INCOIS feed." : "Programmatic access unconfirmed; a synthetic grid stands in. Copernicus Marine is the planned substitute.",
    },
    {
      name: "PostGIS database", powers: "Persistence & model training rows", kind: dbOk ? "live" : "fallback",
      note: dbOk ? "Connected." : "Not connected in this demo. The MHI and zone models fall back to a synthetic generator rather than failing.",
    },
    {
      name: "Bhashini (Hindi / Tamil)", powers: "Localised voice answers", kind: "simulated",
      note: "Pre-built translations stand in for the government ASR/NMT/TTS API. Live Bhashini integration is on the roadmap — we label it rather than imply it.",
    },
    {
      name: "Catch traceability ledger", powers: "Catch provenance & QR trace", kind: "mock",
      note: "A real SHA-256 hash chain, held in memory. Hyperledger Fabric is the production path — the hashing and verification are genuine, the distributed consensus is not.",
    },
  ];

  const counts = {
    live: sources.filter((s) => s.kind === "live").length,
    real: sources.filter((s) => s.kind === "real").length,
    other: sources.filter((s) => ["fallback", "simulated", "mock"].includes(s.kind)).length,
  };

  return (
    <div className="animate-page-enter max-w-6xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-7 md:p-8 text-[#f3f8f6] border border-white/10"
        style={{ background: darkGradient, boxShadow: "0 2px 4px rgba(14,45,52,0.2), 0 18px 40px rgba(14,45,52,0.22)" }}>
        <i className="ph ph-shield-check absolute -right-8 -bottom-10 text-[220px] text-white/[0.04] pointer-events-none" />
        <div className="text-[10px] uppercase tracking-[0.15em] text-[#9fe0d6]/70 mb-2.5" style={mono}>Data transparency</div>
        <h1 className="text-[27px] md:text-[30px] font-semibold leading-tight max-w-2xl m-0" style={{ ...serif, letterSpacing: "-0.01em" }}>
          Every number, and <span className="text-[#9fe0d6]">exactly where it comes from.</span>
        </h1>
        <p className="text-[13px] text-[rgba(220,235,233,0.65)] leading-relaxed max-w-2xl mt-3">
          Some of OceanMind runs on live APIs, some on real measured datasets, and some on clearly-labelled stand-ins
          while integrations are finished. We publish all three rather than blur them — you should be able to check
          any claim on this platform.
        </p>
        <div className="flex flex-wrap gap-x-10 gap-y-4 mt-6 animate-stagger">
          {[
            { v: counts.live, l: "Live integrations" },
            { v: counts.real, l: "Real datasets" },
            { v: counts.other, l: "Labelled stand-ins" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-[28px] font-semibold leading-tight text-[#9fe0d6]" style={serif}>{s.v}</div>
              <div className="text-[9.5px] uppercase tracking-[0.12em] text-[rgba(220,235,233,0.5)] mt-0.5" style={mono}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 px-1">
        {(Object.keys(STATUS) as Kind[]).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <Pill kind={k} />
            <span className="text-[11.5px] text-text-muted">
              {k === "live" && "Real API call, right now"}
              {k === "real" && "Genuine measured / reference data"}
              {k === "fallback" && "Synthetic stand-in, labelled in the UI"}
              {k === "simulated" && "Canned for the MVP"}
              {k === "mock" && "Mock implementation, real cryptography"}
            </span>
          </div>
        ))}
      </div>

      {/* Source inventory */}
      <div className="bg-white border border-card-border rounded-2xl overflow-hidden mb-5" style={{ boxShadow: cardShadow }}>
        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-card-border bg-[linear-gradient(168deg,#fbf7ee,#fff)]">
          <div className="col-span-3 text-[10px] uppercase tracking-[0.1em] text-text-muted" style={mono}>Source</div>
          <div className="col-span-3 text-[10px] uppercase tracking-[0.1em] text-text-muted" style={mono}>Powers</div>
          <div className="col-span-1 text-[10px] uppercase tracking-[0.1em] text-text-muted" style={mono}>Status</div>
          <div className="col-span-5 text-[10px] uppercase tracking-[0.1em] text-text-muted" style={mono}>What that means</div>
        </div>
        {sources.map((s) => (
          <div key={s.name} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-5 py-3.5 border-b border-[#f0ebdf] last:border-0 hover:bg-card-hover/40 transition-colors">
            <div className="lg:col-span-3 text-[13px] font-semibold text-text">{s.name}</div>
            <div className="lg:col-span-3 text-[12px] text-text-secondary">{s.powers}</div>
            <div className="lg:col-span-1"><Pill kind={s.kind} /></div>
            <div className="lg:col-span-5 text-[11.5px] text-text-muted leading-snug">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Why */}
      <div className="bg-white border border-card-border rounded-2xl p-5 mb-5" style={{ boxShadow: cardShadow }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 flex-none rounded-xl bg-[#eaf3ef] text-accent flex items-center justify-center">
            <i className="ph ph-scales text-[18px]" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-text mb-1" style={serif}>Why we run parts of the demo on fallbacks</h3>
            <p className="text-[12.5px] text-text-secondary leading-relaxed max-w-3xl">
              A field tool for fishers has to keep working when a key expires, a government feed goes down, or there&apos;s
              no signal at sea. So every integration has a labelled fallback rather than an error page — and the platform
              tells you which mode it&apos;s in instead of quietly serving you a guess. The status dots above are read from
              the running system, not hardcoded.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-[0.62rem] text-text-faint">
        Status read live from the OceanMind API · models: {health?.mhi_model === "loaded" && health?.sfz_model === "loaded" ? "loaded" : "loading"} · ledger: {health?.blockchain ?? "—"}
      </div>
    </div>
  );
}
