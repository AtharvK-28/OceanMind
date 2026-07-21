"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

// The demo narrative, in order. Each step doubles as a presenter cue card.
const STEPS: { href: string; title: string; say: string }[] = [
  { href: "/", title: "Fisher View", say: "A fisher opens OceanMind before dawn. Live sea state from Open-Meteo, safe zones near their port, a sunset-based return time and one-tap SOS." },
  { href: "/fishing-advisory", title: "Fishing Advisory", say: "One clear answer for any spot — GO, CAUTION or AVOID — computed from live wind, wave and temperature data." },
  { href: "/voice", title: "Ask by Voice", say: "Fishers who can't type ask by voice, in Hindi, Tamil or English. Speech-to-text and playback run live in the browser." },
  { href: "/dashboard", title: "Research Dashboard", say: "Switch personas and the same platform becomes a research console — marine health, zone classification and live KPIs." },
  { href: "/mhi", title: "Marine Health Index", say: "An Isolation Forest anomaly detector scoring ocean health, built on 70 real ARGO float profiles from the Indian Ocean." },
  { href: "/sfz", title: "Sustainable Fishing Zones", say: "An XGBoost classifier grades every shelf cell green, amber or red — with SHAP showing exactly which features drove each call." },
  { href: "/biodiversity", title: "Computer Vision", say: "Real vision inference: upload a landing-site photo and the model returns the species, confidence and its WoRMS AphiaID." },
  { href: "/blockchain", title: "Photo → Ledger → QR", say: "The flagship flow. Snap a catch photo, the AI identifies the species, it's written to a SHA-256 chain, and out comes a catch-to-plate QR." },
  { href: "/digital-twin", title: "Digital Twin", say: "Ask what if the sea warms 2.5 degrees — then watch the marine heatwave unfold week by week across the Indian EEZ." },
  { href: "/impact", title: "Impact", say: "What it actually changes: safer boats, fairer income, healthier seas — measured live today and projected across a 500-fisher pilot, with the model shown." },
  { href: "/pricing", title: "Plans & Pricing", say: "Fishers never pay — their catch data is why everyone else does. Institutions, exporters and agencies fund the platform." },
  { href: "/exporter", title: "Exporter Console", say: "What a paying customer sees: consignments built from the live ledger, and a customs-ready catch certificate you can download." },
  { href: "/trust", title: "Data Trust", say: "And every single data source, labelled live, real or fallback. Nothing hidden — this is the answer to 'is any of this real?'" },
];

export default function GuidedTour() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [i, setI] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  // Keep the tour off public, QR-reachable pages (a consumer shouldn't see it).
  const hidden = pathname.startsWith("/trace");

  useEffect(() => {
    if (open) router.push(STEPS[i].href);
  }, [open, i, router]);

  // Dismissal lasts for the session only — a refresh brings the pill back, so
  // nobody can permanently lose the tour by mis-tapping the ✕.
  if (hidden || dismissed) return null;

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  if (!open) {
    return (
      <div className="fixed bottom-5 left-4 lg:left-[266px] z-[55] inline-flex items-center rounded-full bg-[#16434c] text-[#9fe0d6] border border-white/10 shadow-lg overflow-hidden">
        <button
          onClick={() => { setI(0); setOpen(true); }}
          className="inline-flex items-center gap-2 pl-3 pr-2.5 py-2 text-[12.5px] font-semibold hover:bg-white/[0.08] transition-colors"
          title="Walk through the demo in order"
        >
          <i className="ph-fill ph-play-circle text-[16px]" /> Guided tour
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Hide the guided tour"
          title="Hide until reload"
          className="pl-1.5 pr-2.5 py-2 border-l border-white/10 text-[rgba(220,235,233,0.6)] hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <i className="ph ph-x text-[13px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 left-4 right-4 lg:left-[266px] lg:right-auto lg:w-[430px] z-[55] rounded-2xl border border-white/10 text-[#f3f8f6] overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1a4f59 0%, #10333b 60%, #0c2a30 100%)", boxShadow: "0 8px 20px rgba(14,45,52,0.3), 0 24px 60px rgba(14,45,52,0.35)" }}>
      {/* header */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <i className="ph-fill ph-play-circle text-[15px] text-[#9fe0d6]" />
        <span className="text-[10px] uppercase tracking-[0.14em] text-[#9fe0d6]/80" style={mono}>Guided tour</span>
        <span className="text-[10px] text-[rgba(220,235,233,0.5)] ml-auto" style={mono}>{i + 1} / {STEPS.length}</span>
        <button onClick={() => setOpen(false)} className="text-[rgba(220,235,233,0.6)] hover:text-white ml-2" title="Exit tour">
          <i className="ph ph-x text-[15px]" />
        </button>
      </div>

      {/* body */}
      <div className="px-4 pt-2 pb-3">
        <h3 className="text-[17px] font-semibold leading-tight" style={serif}>{step.title}</h3>
        <p className="text-[12.5px] text-[rgba(220,235,233,0.75)] leading-relaxed mt-1.5">{step.say}</p>
      </div>

      {/* progress */}
      <div className="px-4">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-[#9fe0d6] transition-all duration-300" style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-medium text-[rgba(220,235,233,0.85)] hover:bg-white/[0.08] transition-colors disabled:opacity-30">
          <i className="ph ph-arrow-left text-[13px]" /> Back
        </button>
        {last ? (
          <button onClick={() => setOpen(false)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#9fe0d6] text-[#0e2d34] px-4 py-1.5 text-[12.5px] font-semibold hover:bg-white transition-colors">
            <i className="ph-fill ph-check-circle text-[14px]" /> Finish
          </button>
        ) : (
          <button onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#9fe0d6] text-[#0e2d34] px-4 py-1.5 text-[12.5px] font-semibold hover:bg-white transition-colors">
            Next <i className="ph ph-arrow-right text-[13px]" />
          </button>
        )}
      </div>
    </div>
  );
}
