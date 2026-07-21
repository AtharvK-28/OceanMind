"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import MapContainer from "@/components/maps/MapContainer";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };
const darkGradient = "linear-gradient(135deg, #1a4f59 0%, #10333b 60%, #0c2a30 100%)";
const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";

interface CatchRecord {
  transaction_id: string;
  block_number: number;
  species_aphia_id: number;
  species_name: string;
  quantity_kg: number;
  latitude: number;
  longitude: number;
  landing_site_id: string;
  event_timestamp: string;
  fisher_token: string | null;
  pmmsy_cert_ref: string;
}

interface SpeciesInfo { sci: string; status: string; about: string; habitat: string; size: string; nutrition: string; }
const SPECIES: Record<string, SpeciesInfo> = {
  "Indian Mackerel": {
    sci: "Rastrelliger kanagurta", status: "Least Concern",
    about: "A fast-swimming schooling fish and one of India's most important food fishes, prized for its rich, full flavour.",
    habitat: "Warm coastal waters of the Arabian Sea & Bay of Bengal, 20–90 m deep.",
    size: "20–25 cm typical", nutrition: "Very high in omega-3s, protein and vitamin B12.",
  },
  "Oil Sardine": {
    sci: "Sardinella longiceps", status: "Least Concern",
    about: "A small, oily schooling fish central to the south-west coast catch — a backbone of India's marine landings.",
    habitat: "Upwelling-rich surface waters off Kerala & Karnataka.",
    size: "15–20 cm typical", nutrition: "Among the richest sources of omega-3 and calcium.",
  },
  "Silver Pomfret": {
    sci: "Pampus argenteus", status: "Data Deficient",
    about: "A prized, delicate white-fleshed fish and one of the most valued table fishes on the Indian coast.",
    habitat: "Muddy coastal bottoms and estuaries, 15–40 m deep.",
    size: "25–30 cm typical", nutrition: "Lean, high-protein and low in fat, with a mild flavour.",
  },
  "Yellowfin Tuna": {
    sci: "Thunnus albacares", status: "Near Threatened",
    about: "A large, powerful oceanic predator caught in India's deeper waters for domestic and export markets.",
    habitat: "Open ocean and offshore waters, surface to 250 m.",
    size: "1–1.5 m typical", nutrition: "Very high-protein and lean, rich in selenium and B-vitamins.",
  },
  "Seer Fish": {
    sci: "Scomberomorus commerson", status: "Near Threatened",
    about: "A large mackerel — locally surmai / vanjaram — among the most sought-after high-value table fishes.",
    habitat: "Coastal and reef-associated waters, surface to 100 m.",
    size: "60–90 cm typical", nutrition: "Firm, high-protein flesh rich in omega-3.",
  },
  "Giant Tiger Prawn": {
    sci: "Penaeus monodon", status: "Least Concern",
    about: "India's largest wild-caught and cultured prawn, and a flagship seafood export species.",
    habitat: "Estuaries and coastal muddy bottoms; juveniles in brackish water.",
    size: "20–30 cm typical", nutrition: "Low-fat, high-protein, rich in selenium and B12.",
  },
};
const SITES: Record<string, string> = {
  VERAVAL_GJ: "Veraval, Gujarat", KOCHI_KL: "Kochi, Kerala", CHENNAI_TN: "Chennai, Tamil Nadu",
  VIZAG_AP: "Visakhapatnam, Andhra Pradesh", MANGALORE_KA: "Mangalore, Karnataka",
};
const STATUS_COLOR: Record<string, string> = {
  "Least Concern": "#3a8c5f", "Data Deficient": "#8a9698", "Near Threatened": "#d49a2e",
  "Vulnerable": "#c25a44", "Endangered": "#a5342a",
};
const STATUS_NOTE: Record<string, string> = {
  "Least Concern": "A healthy, well-managed stock — a responsible seafood choice.",
  "Near Threatened": "A closely monitored stock — buying traceable, like this, is what helps.",
  "Data Deficient": "Limited stock data — traceability is how we keep pressure in check.",
};
const speciesIcon = (n: string) => (n.toLowerCase().includes("prawn") ? "ph-fill ph-shrimp" : "ph-fill ph-fish");

const fetcher = (p: string) => apiGet<CatchRecord>(p);

function Shell({ wide, children }: { wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "#f1ece1" }}>
      <div className="sticky top-0 z-10 flex items-center gap-2.5 px-5 py-3 border-b border-[#e3dbc9]" style={{ background: "#16434c" }}>
        <i className="ph ph-wave-sine text-[20px] text-[#9fe0d6]" />
        <span className="text-[15px] font-semibold text-[#f3f8f6]" style={serif}>OceanMind</span>
        <span className="text-[9.5px] uppercase tracking-[0.14em] text-[rgba(220,235,233,0.5)] ml-1" style={mono}>Verified Catch</span>
      </div>
      <div className={`${wide ? "max-w-lg lg:max-w-6xl" : "max-w-lg"} mx-auto px-4 py-5 lg:px-7 lg:py-6`}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10.5px] uppercase tracking-[0.12em] text-text-muted mb-3" style={mono}>{children}</div>;
}

export default function TracePage() {
  const [tx, setTx] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setTx(new URLSearchParams(window.location.search).get("tx"));
    setReady(true);
  }, []);

  const { data, error, isLoading } = useSWR(tx ? `/api/v1/trace/verify/${tx}` : null, fetcher);

  if (!ready || isLoading) {
    return <Shell><div className="text-center py-20 text-sm text-text-muted">Verifying catch on the ledger…</div></Shell>;
  }
  if (!tx || error || !data) {
    return (
      <Shell>
        <div className="bg-white border border-card-border rounded-2xl p-8 text-center mt-6">
          <i className="ph ph-seal-warning text-[40px] text-text-faint" />
          <h1 className="text-[18px] font-semibold text-text mt-3" style={serif}>Catch not found</h1>
          <p className="text-[13px] text-text-muted mt-2">This code doesn&apos;t match any catch on the OceanMind ledger.</p>
          <Link href="/" className="inline-block mt-5 text-[13px] text-accent hover:text-accent-dark">← Back to OceanMind</Link>
        </div>
      </Shell>
    );
  }

  const meta: SpeciesInfo = SPECIES[data.species_name] ?? { sci: data.species_name, status: "Assessed", about: "Traced through the OceanMind catch ledger.", habitat: "Indian coastal waters.", size: "—", nutrition: "—" };
  const site = SITES[data.landing_site_id] ?? data.landing_site_id;
  const statusColor = STATUS_COLOR[meta.status] ?? "#6d7e80";
  const caught = new Date(data.event_timestamp);
  const coast = data.longitude < 77 ? "Arabian Sea" : "Bay of Bengal";
  const shortDate = caught.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const fullDate = caught.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

  const facts = [
    { l: "Caught", v: shortDate },
    { l: "Origin", v: coast },
    { l: "Landed", v: `${data.quantity_kg.toFixed(0)} kg` },
    { l: "Fisher", v: data.fisher_token ?? "Registered" },
  ];
  const journey = [
    { icon: "ph ph-anchor-simple", title: "Caught at sea", body: data.fisher_token ? `Wild-caught by verified fisher ${data.fisher_token}` : "Wild-caught by a registered fisher" },
    { icon: "ph ph-boat", title: "Landed", body: `${site} · ${data.quantity_kg.toFixed(0)} kg` },
    { icon: "ph ph-shield-check", title: "Verified on-chain", body: `Block #${data.block_number} · SHA-256 ${data.transaction_id.slice(0, 10)}…` },
    { icon: "ph ph-fork-knife", title: "On your plate", body: "Fully traced to source" },
  ];
  const standards = [
    { label: "PMMSY registered", on: true },
    { label: "EU IUU Reg. 1005/2008", on: true },
    { label: "US SIMP eligible", on: true },
    { label: "Seasonal-ban compliant", on: true },
  ];

  return (
    <Shell wide>
      {/* HERO BAND — horizontal on desktop, stacked on mobile */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 14px 34px rgba(23,48,57,0.08)" }}>
        <div className="relative text-[#f3f8f6] px-6 py-5 lg:flex lg:items-center lg:justify-between lg:gap-8" style={{ background: darkGradient }}>
          <i className={`${speciesIcon(data.species_name)} absolute right-2 -bottom-6 text-[130px] text-white/[0.05] pointer-events-none`} />
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-3 lg:gap-4 text-center lg:text-left">
            <span className="inline-flex w-14 h-14 flex-none rounded-full bg-white/[0.08] border border-white/[0.14] items-center justify-center">
              <i className={`${speciesIcon(data.species_name)} text-[27px] text-[#9fe0d6]`} />
            </span>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.1] border border-white/[0.14] text-[#9fe0d6] px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.06em]" style={mono}>
                <i className="ph-fill ph-seal-check text-[12px]" /> VERIFIED WILD CATCH
              </span>
              <h1 className="text-[24px] lg:text-[26px] font-semibold mt-1.5 leading-tight" style={serif}>{data.species_name}</h1>
              <div className="text-[12.5px] text-[rgba(220,235,233,0.6)] italic" style={serif}>{meta.sci}</div>
            </div>
          </div>
          {/* facts */}
          <div className="relative mt-4 lg:mt-0 flex justify-center lg:justify-end flex-wrap gap-x-6 gap-y-3">
            {facts.map((f) => (
              <div key={f.l} className="text-center lg:text-right min-w-[70px]">
                <div className="text-[9px] uppercase tracking-[0.1em] text-[rgba(220,235,233,0.5)]" style={mono}>{f.l}</div>
                <div className="text-[14px] font-semibold text-[#f3f8f6] mt-0.5" style={mono}>{f.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN — three balanced columns on desktop, stacked on mobile */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4 items-start">
        {/* Col A — Catch origin */}
        <div className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: cardShadow }}>
          <SectionLabel>Catch origin</SectionLabel>
          <div className="rounded-xl overflow-hidden border border-card-border">
            <MapContainer height="180px" center={[data.latitude, data.longitude]} zoom={7}
              points={[{ lat: data.latitude, lng: data.longitude, color: "#1f7a8c", radius: 9, tooltip: `Caught here · ${data.species_name}` }]} />
          </div>
          <div className="text-center text-[10.5px] text-text-faint mt-2" style={mono}>
            <i className="ph ph-map-pin text-[12px]" /> {data.latitude.toFixed(3)}°, {data.longitude.toFixed(3)}° · {coast}
          </div>
          <div className="mt-3 pt-3 border-t border-[#f0ebdf] space-y-2">
            <div className="flex items-center gap-2 text-[12.5px]"><i className="ph ph-boat text-[15px] text-accent" /> <span className="text-text-muted">Landed at</span> <span className="font-semibold text-text ml-auto">{site}</span></div>
            <div className="flex items-center gap-2 text-[12.5px]"><i className="ph ph-calendar-blank text-[15px] text-accent" /> <span className="text-text-muted">Caught on</span> <span className="font-semibold text-text ml-auto">{fullDate}</span></div>
          </div>
        </div>

        {/* Col B — Journey + standards */}
        <div className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: cardShadow }}>
          <SectionLabel>Journey to your plate</SectionLabel>
          <div className="relative">
            {journey.map((s, i) => (
              <div key={s.title} className="flex items-center gap-3 pb-3.5 last:pb-0 relative">
                {i < journey.length - 1 && <span className="absolute left-[17px] top-9 bottom-0 w-px bg-[#e3dbc9]" />}
                <span className="w-9 h-9 flex-none rounded-full bg-[#eaf3ef] text-accent flex items-center justify-center z-10">
                  <i className={`${s.icon} text-[16px]`} />
                </span>
                <div>
                  <div className="text-[13.5px] font-semibold text-text leading-tight" style={serif}>{s.title}</div>
                  <div className="text-[11.5px] text-text-secondary mt-0.5" style={i === 2 ? mono : undefined}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#f0ebdf]">
            <div className="text-[10px] uppercase tracking-[0.1em] text-text-muted mb-2" style={mono}>Standards met</div>
            <div className="grid grid-cols-1 gap-1.5">
              {standards.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-[11.5px] text-text-secondary">
                  <i className="ph-fill ph-check-circle text-[14px] text-[#2f6f4c] flex-none" /> {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col C — About + sustainability */}
        <div className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: cardShadow }}>
          <SectionLabel>About this catch</SectionLabel>
          <div className="flex items-start gap-3 rounded-xl border p-3 mb-3" style={{ background: `${statusColor}0d`, borderColor: `${statusColor}30` }}>
            <span className="w-8 h-8 flex-none rounded-full flex items-center justify-center" style={{ background: `${statusColor}1f`, color: statusColor }}>
              <i className="ph-fill ph-leaf text-[15px]" />
            </span>
            <div>
              <div className="text-[12.5px] font-semibold" style={{ color: statusColor }}>{meta.status}</div>
              <p className="text-[11.5px] text-text-secondary leading-snug mt-0.5">{STATUS_NOTE[meta.status] ?? "Sourced and traced through OceanMind."}</p>
            </div>
          </div>
          <p className="text-[12.5px] text-text-secondary leading-relaxed">{meta.about}</p>
          <div className="mt-3 pt-3 border-t border-[#f0ebdf] space-y-2.5">
            {[
              { i: "ph ph-waves", l: "Habitat", v: meta.habitat },
              { i: "ph ph-ruler", l: "Typical size", v: meta.size },
              { i: "ph ph-heartbeat", l: "Nutrition", v: meta.nutrition },
            ].map((r) => (
              <div key={r.l} className="flex gap-2.5">
                <i className={`${r.i} text-[15px] text-accent flex-none mt-0.5`} />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted" style={mono}>{r.l}</div>
                  <div className="text-[12px] text-text-secondary leading-snug">{r.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROOF STRIP — full width */}
      <div className="rounded-xl border border-card-border bg-white px-4 py-3 mb-3 lg:flex lg:items-center lg:gap-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
        <div className="flex items-center gap-2 flex-none">
          <i className="ph ph-fingerprint text-[16px] text-accent" />
          <span className="text-[11.5px] font-semibold text-text">Ledger proof · SHA-256</span>
          <span className="ml-auto lg:ml-0 text-[10px] text-text-faint">AphiaID {data.species_aphia_id}</span>
        </div>
        <div className="text-[10px] text-text-secondary leading-relaxed break-all mt-1.5 lg:mt-0 lg:flex-1" style={mono}>{data.transaction_id}</div>
      </div>

      <div className="text-center text-[10px] text-text-faint leading-relaxed">
        Recorded on the OceanMind catch ledger · demo record, illustrative only ·{" "}
        <Link href="/" className="text-accent hover:text-accent-dark">how it works →</Link>
      </div>
    </Shell>
  );
}
