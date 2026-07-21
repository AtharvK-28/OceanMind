"use client";
import useSWR from "swr";
import { apiGet } from "@/lib/api";
import type { SFZCurrentResponse, MHIStatusResponse } from "@/types/api";

const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";
const darkGradient = "linear-gradient(177deg, #16434c 0%, #10333b 60%, #0e2d34 100%)";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

interface FootprintSummary {
  total_catches: number;
  total_kg: number;
  avg_score: number | null;
  green_share_pct: number;
}
const get = <T,>(p: string) => apiGet<T>(p);

// Transparent pilot-scale model — every projected figure below is derived
// from these five numbers, shown on the page so nothing is a black box.
const PILOT = { fishers: 500, tripsPerMonth: 12, litresPerTrip: 3, dieselInr: 95, co2PerLitre: 2.68 };
const tripsYear = PILOT.fishers * PILOT.tripsPerMonth * 12;
const litresYear = tripsYear * PILOT.litresPerTrip;
const inrYear = litresYear * PILOT.dieselInr;
const co2TonnesYear = (litresYear * PILOT.co2PerLitre) / 1000;
const carsEquiv = Math.round(co2TonnesYear / 4.6);
const inrPerFisher = Math.round(inrYear / PILOT.fishers / 1000) * 1000;

const nf = (n: number) => n.toLocaleString("en-IN");
const crore = (n: number) => `₹${(n / 1e7).toFixed(2)} Cr`;

function Tag({ kind }: { kind: "live" | "projected" }) {
  const live = kind === "live";
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
      style={{ ...mono, background: live ? "#eaf3ef" : "#eef2f7", color: live ? "#2f6f4c" : "#5b6d8c" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: live ? "#3a8c5f" : "#8496b5" }} />
      {live ? "Live" : "Projected"}
    </span>
  );
}

const SDGS: Record<string, { n: number; name: string; color: string }> = {
  safety:  { n: 3,  name: "Good Health & Well-being",        color: "#4C9F38" },
  sustain: { n: 14, name: "Life Below Water",                color: "#0A97D9" },
  liveli:  { n: 8,  name: "Decent Work & Economic Growth",   color: "#A21942" },
  trace:   { n: 12, name: "Responsible Consumption",         color: "#BF8B2E" },
  climate: { n: 13, name: "Climate Action",                  color: "#3F7E44" },
};

export default function ImpactPage() {
  const { data: fp } = useSWR<FootprintSummary>("/api/v1/footprint/summary", get, { revalidateOnFocus: false });
  const { data: sfz } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", get, { revalidateOnFocus: false });
  const { data: mhi } = useSWR<MHIStatusResponse>("/api/v1/mhi/status", get, { revalidateOnFocus: false });

  const feats = sfz?.geojson?.features ?? [];
  const green = feats.filter((f) => f.properties?.ecological_class === "GREEN").length;
  const red = feats.filter((f) => f.properties?.ecological_class === "RED").length;
  const traceableKg = fp?.total_kg ?? 0;
  const sustainablePct = fp?.green_share_pct ?? 0;
  const blueScore = fp?.avg_score ?? 0;
  const cells = mhi?.total_cells ?? 0;

  const pillars = [
    {
      key: "safety", icon: "ph ph-lifebuoy", name: "Safety at sea",
      metric: `${nf(tripsYear)}`, unit: "safe-return reminders / year", kind: "projected" as const,
      desc: "Every trip gets a sunset-based return time and a one-tap SOS with GPS — the difference between a close call and a tragedy.",
    },
    {
      key: "sustain", icon: "ph ph-leaf", name: "Sustainable fishing",
      metric: `${sustainablePct}%`, unit: "of logged catch rated sustainable", kind: "live" as const,
      desc: `Effort is steered away from ${red} red / overfished zones toward ${green} recommended low-bycatch grounds.`,
    },
    {
      key: "liveli", icon: "ph ph-coins", name: "Fisher livelihoods",
      metric: crore(inrYear), unit: `fuel saved / year · ~₹${nf(inrPerFisher)} per fisher`, kind: "projected" as const,
      desc: "Optimised routing to the nearest good zone — plus best-market landing advice — puts money back in fishers' pockets.",
    },
    {
      key: "trace", icon: "ph ph-link", name: "Traceability",
      metric: `${nf(traceableKg)} kg`, unit: "catch made verifiable on the ledger", kind: "live" as const,
      desc: "SHA-256 provenance from boat to buyer — export-ready for EU IUU and US SIMP markets that demand it.",
    },
    {
      key: "climate", icon: "ph ph-cloud-fog", name: "Climate resilience",
      metric: `${nf(Math.round(co2TonnesYear))} t`, unit: `CO₂ avoided / year · ≈ ${carsEquiv} cars off the road`, kind: "projected" as const,
      desc: "Less fuel burned, plus a marine-heatwave early-warning that flags species-collapse risk weeks ahead.",
    },
  ];

  return (
    <div className="animate-page-enter max-w-6xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-7 md:p-8 text-[#f3f8f6] border border-white/10"
        style={{ background: darkGradient, boxShadow: "0 2px 4px rgba(14,45,52,0.2), 0 18px 40px rgba(14,45,52,0.22)" }}>
        <i className="ph ph-heartbeat absolute -right-8 -bottom-10 text-[220px] text-white/[0.04] pointer-events-none" />
        <div className="text-[10px] uppercase tracking-[0.15em] text-[#9fe0d6]/70 mb-2.5" style={mono}>Why it matters</div>
        <h1 className="text-[27px] md:text-[31px] font-semibold leading-tight max-w-2xl m-0" style={{ ...serif, letterSpacing: "-0.01em" }}>
          Measurable impact — <span className="text-[#9fe0d6]">safer boats, fairer income, healthier seas.</span>
        </h1>
        <p className="text-[13px] text-[rgba(220,235,233,0.65)] leading-relaxed max-w-2xl mt-3">
          OceanMind isn&apos;t a dashboard for its own sake. Here&apos;s what it changes for fishers, buyers and the ocean —
          measured from live platform data today, and projected across a 500-fisher pilot.
        </p>
        <div className="flex flex-wrap gap-x-10 gap-y-4 mt-6 animate-stagger">
          {[
            { v: `${nf(traceableKg)} kg`, l: "Catch traceable today", tag: "live" as const },
            { v: crore(inrYear), l: "Fisher fuel savings / yr", tag: "projected" as const },
            { v: `${nf(Math.round(co2TonnesYear))} t`, l: "CO₂ avoided / yr", tag: "projected" as const },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-[28px] font-semibold leading-tight text-[#9fe0d6]" style={serif}>{s.v}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9.5px] uppercase tracking-[0.12em] text-[rgba(220,235,233,0.5)]" style={mono}>{s.l}</span>
              </div>
              <div className="mt-1.5"><Tag kind={s.tag} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Measured today */}
      <div className="flex items-center gap-3 mb-3.5">
        <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted flex-none" style={mono}>Measured on the platform today</span>
        <span className="h-px flex-1 bg-[#e3dbc9]" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { v: `${nf(traceableKg)} kg`, l: "Catch made traceable", i: "ph ph-cube" },
          { v: `${blueScore}/100`, l: "Fleet sustainability score", i: "ph ph-leaf" },
          { v: green, l: "Green zones identified", i: "ph ph-map-trifold" },
          { v: cells, l: "Ocean cells health-monitored", i: "ph ph-grid-nine" },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: cardShadow }}>
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-[#eaf3ef] text-accent flex items-center justify-center"><i className={`${k.i} text-[17px]`} /></span>
              <Tag kind="live" />
            </div>
            <div className="text-[26px] font-bold leading-none text-text" style={serif}>{k.v}</div>
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-text-muted mt-1.5" style={mono}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Five pillars */}
      <div className="flex items-center gap-3 mb-3.5">
        <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted flex-none" style={mono}>Five ways OceanMind creates value</span>
        <span className="h-px flex-1 bg-[#e3dbc9]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {pillars.map((p) => {
          const sdg = SDGS[p.key];
          return (
            <div key={p.key} className="bg-white border border-card-border rounded-2xl p-5 flex flex-col transition-all hover:-translate-y-0.5" style={{ boxShadow: cardShadow }}>
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-[#eaf3ef] text-accent flex items-center justify-center"><i className={`${p.icon} text-[19px]`} /></span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold" style={{ ...mono, background: `${sdg.color}14`, color: sdg.color }}>
                  SDG {sdg.n}
                </span>
              </div>
              <h3 className="text-[16px] font-semibold text-text" style={serif}>{p.name}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-[26px] font-bold leading-none text-text" style={serif}>{p.metric}</span>
                <Tag kind={p.kind} />
              </div>
              <div className="text-[11px] text-text-muted mt-1">{p.unit}</div>
              <p className="text-[12px] text-text-secondary leading-relaxed mt-3">{p.desc}</p>
            </div>
          );
        })}

        {/* Model transparency card fills the 6th grid slot */}
        <div className="rounded-2xl p-5 text-[#f3f8f6] flex flex-col" style={{ background: darkGradient, boxShadow: cardShadow }}>
          <div className="flex items-center gap-2 mb-3">
            <i className="ph ph-function text-[19px] text-[#9fe0d6]" />
            <h3 className="text-[15px] font-semibold" style={serif}>How the projections work</h3>
          </div>
          <p className="text-[11.5px] text-[rgba(220,235,233,0.7)] leading-relaxed">
            Every projected figure comes from one transparent model — no black box:
          </p>
          <div className="mt-3 space-y-1.5 text-[11.5px]" style={mono}>
            {[
              ["Pilot cohort", `${PILOT.fishers} fishers`],
              ["Trips / fisher / mo", `${PILOT.tripsPerMonth}`],
              ["Fuel saved / trip", `${PILOT.litresPerTrip} L`],
              ["Diesel price", `₹${PILOT.dieselInr}/L`],
              ["Emissions factor", `${PILOT.co2PerLitre} kg CO₂/L`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/[0.08] pb-1.5">
                <span className="text-[rgba(220,235,233,0.55)]">{k}</span>
                <span className="text-[#9fe0d6]">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-[10.5px] text-[rgba(220,235,233,0.5)] mt-3 leading-relaxed">
            Conservative, adjustable, and defensible in Q&amp;A — change one number and every projection updates.
          </p>
        </div>
      </div>

      {/* SDG alignment */}
      <div className="flex items-center gap-3 mb-3.5">
        <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted flex-none" style={mono}>UN Sustainable Development Goals advanced</span>
        <span className="h-px flex-1 bg-[#e3dbc9]" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.values(SDGS).map((s) => (
          <div key={s.n} className="rounded-xl p-3 text-center border" style={{ background: `${s.color}0d`, borderColor: `${s.color}26` }}>
            <div className="text-[22px] font-bold leading-none" style={{ ...serif, color: s.color }}>{s.n}</div>
            <div className="text-[10px] text-text-secondary mt-1.5 leading-tight">{s.name}</div>
          </div>
        ))}
      </div>

      <div className="text-center text-[0.62rem] text-text-faint">
        Live figures computed from the catch ledger, footprint scorer and zone classifier · projected figures modelled at 500-fisher pilot scale · assumptions shown above
      </div>
    </div>
  );
}
