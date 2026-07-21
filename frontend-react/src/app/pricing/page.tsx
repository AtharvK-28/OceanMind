"use client";
import Link from "next/link";

const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";
const darkGradient = "linear-gradient(177deg, #16434c 0%, #10333b 60%, #0e2d34 100%)";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

const FLYWHEEL = [
  { icon: "ph ph-sailboat", label: "Fishers log real catches" },
  { icon: "ph ph-brain", label: "Models learn from ground truth" },
  { icon: "ph ph-target", label: "Advisories get sharper" },
  { icon: "ph ph-users-three", label: "More fishers join" },
  { icon: "ph ph-cube", label: "Traceability data compounds" },
];

const FREE_HALVES = [
  {
    name: "Fisher",
    audience: "Everyone on the water",
    icon: "ph ph-sailboat",
    color: "#3a8c5f",
    bg: "#eaf3ef",
    note: "The supply side of the flywheel — never a customer.",
    features: [
      "Daily GO / CAUTION / AVOID advisory",
      "Live sea conditions, tides & return-time",
      "SOS button, offline mode & zone alerts",
      "Ask by voice — Hindi, Tamil, English",
    ],
  },
  {
    name: "Researcher",
    audience: "Scientists & students",
    icon: "ph ph-microscope",
    color: "#1f7a8c",
    bg: "#e8f1f4",
    note: "Open dashboard keeps the science community close.",
    features: [
      "Full research dashboard & maps",
      "Marine Health Index & fishing zones",
      "Digital twin scenario viewer",
      "Ask OceanMind (RAG) with provenance",
    ],
  },
];

interface PaidTier {
  name: string;
  audience: string;
  price: string;
  priceNote: string;
  icon: string;
  color: string;
  bg: string;
  features: string[];
  badge?: string;
  featured?: boolean;
}

const PAID_TIERS: PaidTier[] = [
  {
    name: "Institution Pro",
    audience: "Universities · labs · consultancies",
    price: "₹2.5L",
    priceNote: "per year, per institution",
    icon: "ph ph-buildings",
    color: "#1f7a8c",
    bg: "#e8f1f4",
    features: [
      "REST API access & bulk data export",
      "Historical time series (ARGO, MHI, SFZ)",
      "Unlimited digital-twin scenario runs",
      "Custom regions & priority support",
    ],
  },
  {
    name: "Exporter Traceability",
    audience: "Seafood exporters & processors",
    price: "₹100",
    priceNote: "per verified certificate · or ₹25k/mo",
    icon: "ph ph-seal-check",
    color: "#d49a2e",
    bg: "#f7efdb",
    badge: "Primary revenue stream",
    featured: true,
    features: [
      "Hash-verified catch certificates",
      "EU IUU & US SIMP compliance reports",
      "Ledger API for supply-chain systems",
      "Sustainability score per consignment",
    ],
  },
  {
    name: "Government",
    audience: "State fisheries departments",
    price: "Custom",
    priceNote: "per-district partnership",
    icon: "ph ph-bank",
    color: "#5b6d8c",
    bg: "#eaedf3",
    features: [
      "Advisory dissemination to registered fishers",
      "SOS & safety infrastructure integration",
      "Compliance monitoring dashboards",
      "INCOIS / CMFRI data-sharing workflows",
    ],
  },
];

const ECONOMICS = [
  { icon: "ph ph-cloud-check", value: "~₹25k / mo", label: "Total run cost at pilot scale", color: "#3a8c5f", bg: "#3a8c5f" },
  { icon: "ph ph-scales", value: "2 licenses", label: "Covers the entire platform", color: "#1f7a8c", bg: "#1f7a8c" },
  { icon: "ph ph-globe-simple", value: "100% open data", label: "ARGO · Open-Meteo · GFW inputs", color: "#d49a2e", bg: "#d49a2e" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3.5">
      <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted flex-none" style={mono}>{children}</span>
      <span className="h-px flex-1 bg-[#e3dbc9]" />
    </div>
  );
}

function PaidCard({ tier }: { tier: PaidTier }) {
  if (tier.featured) {
    return (
      <div className="relative rounded-2xl p-6 flex flex-col text-[#f3f8f6] border border-white/10 transition-all hover:-translate-y-1"
        style={{ background: darkGradient, boxShadow: "0 2px 4px rgba(14,45,52,0.2), 0 18px 40px rgba(14,45,52,0.25)" }}>
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#d49a2e] text-[#2b1f08] text-[9.5px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5" style={mono}>
          {tier.badge}
        </span>
        <div className="flex items-center gap-3 mb-4 mt-1">
          <span className="w-11 h-11 rounded-xl bg-white/10 border border-white/[0.14] text-[#9fe0d6] flex items-center justify-center">
            <i className={`${tier.icon} text-[20px]`} />
          </span>
          <div>
            <h3 className="text-[18px] font-semibold leading-tight" style={serif}>{tier.name}</h3>
            <div className="text-[11px] text-[rgba(220,235,233,0.55)]">{tier.audience}</div>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[34px] font-bold leading-none text-[#9fe0d6]" style={serif}>{tier.price}</span>
        </div>
        <div className="text-[11px] text-[rgba(220,235,233,0.55)] mb-5">{tier.priceNote}</div>
        <ul className="space-y-2.5">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[12.5px] text-[rgba(230,242,240,0.85)] leading-snug">
              <i className="ph ph-check-circle text-[15px] flex-none mt-[1px] text-[#9fe0d6]" />
              {f}
            </li>
          ))}
        </ul>
        <Link href="/exporter"
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-[#9fe0d6] hover:bg-white text-[#0e2d34] py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5">
          <i className="ph ph-eye text-[15px]" /> See what exporters get
        </Link>
      </div>
    );
  }
  return (
    <div className="bg-white border border-card-border rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:border-accent/25" style={{ boxShadow: cardShadow }}>
      <div className="h-[3px]" style={{ background: tier.color }} />
      <div className="p-6 pt-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: tier.bg, color: tier.color }}>
            <i className={`${tier.icon} text-[20px]`} />
          </span>
          <div>
            <h3 className="text-[18px] font-semibold text-text leading-tight" style={serif}>{tier.name}</h3>
            <div className="text-[11px] text-text-muted">{tier.audience}</div>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[34px] font-bold leading-none" style={{ ...serif, color: tier.color }}>{tier.price}</span>
        </div>
        <div className="text-[11px] text-text-faint mb-5">{tier.priceNote}</div>
        <ul className="space-y-2.5 mt-auto">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[12.5px] text-text-secondary leading-snug">
              <i className="ph ph-check-circle text-[15px] flex-none mt-[1px]" style={{ color: tier.color }} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="animate-page-enter">
      {/* Statement hero */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-7 md:p-8 text-[#f3f8f6] border border-white/10"
        style={{ background: darkGradient, boxShadow: "0 2px 4px rgba(14,45,52,0.2), 0 18px 40px rgba(14,45,52,0.22)" }}>
        <i className="ph ph-wave-sine absolute -right-8 -bottom-10 text-[220px] text-white/[0.04] pointer-events-none" />
        <div className="text-[10px] uppercase tracking-[0.15em] text-[#9fe0d6]/70 mb-2.5" style={mono}>Business model</div>
        <h1 className="text-[27px] md:text-[30px] font-semibold leading-tight max-w-xl m-0" style={{ ...serif, letterSpacing: "-0.01em" }}>
          Fishers never pay. <span className="text-[#9fe0d6]">Their data is why everyone else does.</span>
        </h1>
        <p className="text-[13px] text-[rgba(220,235,233,0.65)] leading-relaxed max-w-xl mt-3">
          Every logged catch improves the models and extends the traceability ledger. Institutions, exporters
          and agencies pay for that data — verified, exported and compliant — which keeps the platform free
          for the people who create it.
        </p>
        <div className="flex flex-wrap gap-x-10 gap-y-4 mt-6 animate-stagger">
          {[
            { value: "₹0", label: "Fisher cost, forever" },
            { value: "3", label: "Revenue streams" },
            { value: "~₹25k/mo", label: "Run cost at pilot scale" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[26px] font-semibold leading-tight text-[#9fe0d6]" style={serif}>{s.value}</div>
              <div className="text-[9.5px] uppercase tracking-[0.12em] text-[rgba(220,235,233,0.5)] mt-0.5" style={mono}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data flywheel */}
      <SectionLabel>The data flywheel</SectionLabel>
      <div className="bg-white border border-card-border rounded-2xl px-6 py-5 mb-6 overflow-x-auto" style={{ boxShadow: cardShadow }}>
        <div className="flex items-stretch min-w-max animate-stagger">
          {FLYWHEEL.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center text-center w-[128px]">
                <div className="relative">
                  <span className="w-12 h-12 rounded-full bg-[#eaf3ef] text-accent flex items-center justify-center border border-[#1f7a8c]/15">
                    <i className={`${step.icon} text-[20px]`} />
                  </span>
                  <span className="absolute -top-1 -right-1.5 w-[18px] h-[18px] rounded-full bg-[#16434c] text-[#9fe0d6] text-[8.5px] font-semibold flex items-center justify-center" style={mono}>
                    {i + 1}
                  </span>
                </div>
                <span className="text-[11.5px] text-text-secondary leading-tight mt-2.5">{step.label}</span>
              </div>
              {i < FLYWHEEL.length - 1 && (
                <div className="flex items-center self-start mt-6 mx-1">
                  <span className="w-6 h-px bg-[#d8cfbc]" />
                  <i className="ph ph-caret-right text-[11px] text-[#c4b89f] -ml-0.5" />
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center self-start mt-3.5 ml-4 pl-5 border-l border-dashed border-[#d8cfbc]">
            <div className="flex flex-col items-center text-center w-[104px]">
              <i className="ph ph-arrows-clockwise text-[22px] text-accent" />
              <span className="text-[10px] uppercase tracking-[0.08em] text-text-muted mt-1.5" style={mono}>and it compounds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free — the open platform */}
      <SectionLabel>Free — the open platform</SectionLabel>
      <div className="bg-white border border-card-border rounded-2xl mb-6 overflow-hidden" style={{ boxShadow: cardShadow, background: "linear-gradient(168deg, #fbf7ee, #fff)" }}>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {FREE_HALVES.map((half, i) => (
            <div key={half.name} className={`p-6 ${i === 1 ? "border-t md:border-t-0 md:border-l border-card-border" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: half.bg, color: half.color }}>
                    <i className={`${half.icon} text-[20px]`} />
                  </span>
                  <div>
                    <h3 className="text-[18px] font-semibold text-text leading-tight" style={serif}>{half.name}</h3>
                    <div className="text-[11px] text-text-muted">{half.audience}</div>
                  </div>
                </div>
                <span className="rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, background: `${half.color}14`, color: half.color, border: `1px solid ${half.color}30` }}>
                  Free
                </span>
              </div>
              <p className="text-[12px] text-text-muted italic mb-4" style={serif}>{half.note}</p>
              <ul className="space-y-2.5">
                {half.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[12.5px] text-text-secondary leading-snug">
                    <i className="ph ph-check-circle text-[15px] flex-none mt-[1px]" style={{ color: half.color }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Paid — who sustains it */}
      <SectionLabel>Paid — who sustains it</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 pt-3 animate-stagger">
        {PAID_TIERS.map((t) => <PaidCard key={t.name} tier={t} />)}
      </div>

      {/* Unit economics */}
      <SectionLabel>Why the math works</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 animate-stagger">
        {ECONOMICS.map((e) => (
          <div key={e.label} className="rounded-xl p-4 text-center border transition-all"
            style={{ background: `${e.bg}0f`, borderColor: `${e.bg}26` }}>
            <i className={`${e.icon} text-[20px]`} style={{ color: e.color }} />
            <div className="text-[19px] font-bold text-text mt-1 leading-tight" style={serif}>{e.value}</div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-text-muted mt-1" style={mono}>{e.label}</div>
          </div>
        ))}
      </div>

      <div className="text-center text-[0.62rem] text-text-faint">
        Indicative pilot pricing · subscriptions & billing are on the roadmap — the platform is currently in open pilot
      </div>
    </div>
  );
}
