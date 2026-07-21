"use client";
import { useMemo } from "react";
import useSWR from "swr";
import { apiGet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import HeroBanner from "@/components/ui/HeroBanner";
import ErrorState from "@/components/ui/ErrorState";
import type { CatchRecord } from "@/types/api";

interface Summary {
  total_catches: number;
  total_kg: number;
  avg_score: number | null;
  ratings: { SUSTAINABLE?: number; MODERATE?: number; HIGH_IMPACT?: number };
  green_share_pct: number;
  closed_season_catches: number;
  compliant_catches: number;
  species_status: Record<string, number>;
}

const fetcher = (p: string) => apiGet<Summary>(p);
const historyFetcher = (p: string) => apiGet<{ records: CatchRecord[] }>(p).then((r) => r.records);

const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

function scoreColor(s: number) {
  if (s >= 70) return "#3a8c5f";
  if (s >= 40) return "#d49a2e";
  return "#c25a44";
}

const STATUS_COLOR: Record<string, string> = {
  "Least Concern": "#3a8c5f",
  "Data Deficient": "#8a9698",
  "Near Threatened": "#d49a2e",
  "Vulnerable": "#c25a44",
  "Endangered": "#a5342a",
  "Critically Endangered": "#7a241c",
};

// Mirrors the server's _IUCN_SCORE / _ZONE_SCORE tables so the page can explain
// exactly how a score was reached rather than just asserting a number.
const IUCN_POINTS: { code: string; label: string; pts: number }[] = [
  { code: "LC", label: "Least Concern", pts: 100 },
  { code: "DD", label: "Data Deficient", pts: 70 },
  { code: "NT", label: "Near Threatened", pts: 55 },
  { code: "VU", label: "Vulnerable", pts: 30 },
  { code: "EN", label: "Endangered", pts: 12 },
  { code: "CR", label: "Critically Endangered", pts: 3 },
];
const ZONE_POINTS = [
  { code: "GREEN", label: "Recommended zone", pts: 100, color: "#3a8c5f" },
  { code: "AMBER", label: "Caution zone", pts: 55, color: "#d49a2e" },
  { code: "RED", label: "Avoid zone", pts: 15, color: "#c25a44" },
];

const BANDS = [
  { min: 70, max: 100, label: "Sustainable", color: "#3a8c5f", desc: "Healthy species from a recommended zone. Keep fishing this way." },
  { min: 40, max: 69, label: "Moderate", color: "#d49a2e", desc: "Acceptable, but either the species is under pressure or the zone isn't ideal." },
  { min: 0, max: 39, label: "High impact", color: "#c25a44", desc: "A threatened species, an avoid zone, or both. Worth changing gear or grounds." },
];

function Bar({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <>
      <div className="flex h-3 rounded-full overflow-hidden bg-[#eee7d8]">
        {segments.map((s) => s.value > 0 && (
          <div key={s.label} title={`${s.label}: ${s.value}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11.5px] text-text-secondary">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label} <b className="text-text">{s.value}</b>
          </span>
        ))}
      </div>
    </>
  );
}

/** Radial gauge for the fleet score — reads faster than a bare number. */
function Gauge({ score }: { score: number }) {
  const r = 62;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const col = scoreColor(score);
  return (
    <div className="relative" style={{ width: 156, height: 156 }}>
      <svg width={156} height={156} className="-rotate-90">
        <circle cx={78} cy={78} r={r} fill="none" stroke="#eee7d8" strokeWidth={13} />
        <circle cx={78} cy={78} r={r} fill="none" stroke={col} strokeWidth={13} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray .8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[46px] font-black leading-none" style={{ color: col, ...serif }}>{score}</div>
        <div className="text-[10px] text-text-faint mt-0.5" style={mono}>/ 100</div>
      </div>
    </div>
  );
}

export default function FootprintPage() {
  const { t } = useI18n();
  const { data, error, mutate } = useSWR<Summary>("/api/v1/footprint/summary", fetcher, { refreshInterval: 15000 });
  // Shared SWR key — other consumers use a fetcher returning the raw envelope,
  // so accept either shape instead of assuming an array.
  const { data: raw } = useSWR<CatchRecord[] | { records: CatchRecord[] }>("/api/v1/trace/history", historyFetcher, { refreshInterval: 15000 });
  const records: CatchRecord[] = Array.isArray(raw) ? raw : (raw?.records ?? []);

  const n = data?.total_catches ?? 0;
  const avg = data?.avg_score ?? 0;
  const band = BANDS.find((b) => avg >= b.min && avg <= b.max) ?? BANDS[2];

  // Per-species landings, derived from the ledger itself.
  const bySpecies = useMemo(() => {
    const m = new Map<string, { kg: number; count: number }>();
    for (const r of records) {
      const cur = m.get(r.species_name) ?? { kg: 0, count: 0 };
      m.set(r.species_name, { kg: cur.kg + r.quantity_kg, count: cur.count + 1 });
    }
    return [...m.entries()].map(([species, v]) => ({ species, ...v })).sort((a, b) => b.kg - a.kg);
  }, [records]);
  const maxKg = bySpecies[0]?.kg ?? 1;

  // Actionable guidance driven by what the fleet is actually doing.
  const actions = useMemo(() => {
    const out: { icon: string; title: string; body: string; color: string }[] = [];
    const greenPct = data?.green_share_pct ?? 0;
    const closed = data?.closed_season_catches ?? 0;
    const highImpact = data?.ratings.HIGH_IMPACT ?? 0;
    if (greenPct < 60) out.push({
      icon: "ph ph-map-trifold", color: "#1f7a8c",
      title: "Fish more of the recommended zones",
      body: `Only ${greenPct}% of landings came from green zones. Zone weight is 30% of the score — moving one trip a week to a green zone lifts the fleet average faster than anything else.`,
    });
    if (closed > 0) out.push({
      icon: "ph ph-prohibit", color: "#c25a44",
      title: `${closed} catch${closed === 1 ? "" : "es"} inside a closed period`,
      body: "Monsoon-ban and no-take-zone landings are flagged separately from the ecological score. These are the entries an inspector or a buyer's auditor will ask about first.",
    });
    if (highImpact > 0) out.push({
      icon: "ph ph-warning-circle", color: "#a5342a",
      title: `${highImpact} high-impact landing${highImpact === 1 ? "" : "s"}`,
      body: "Driven by IUCN status — Near Threatened and worse species cost the most points. Releasing juveniles and capping the take on those species is the direct fix.",
    });
    out.push({
      icon: "ph ph-certificate", color: "#3a8c5f",
      title: "This score is your export evidence",
      body: "EU IUU catch certificates and buyer sustainability audits ask for exactly this: species, zone, date, legality. A high Blue Score with ledger-backed provenance is what unlocks the premium price.",
    });
    return out;
  }, [data]);

  return (
    <div className="animate-page-enter max-w-6xl">
      <HeroBanner title={t("fp.title")} description={t("fp.subtitle")} />

      {error ? (
        <ErrorState message="Couldn't load footprint data" onRetry={() => mutate()} />
      ) : n === 0 ? (
        <div className="bg-white border border-card-border rounded-2xl p-10 text-center" style={{ boxShadow: cardShadow }}>
          <i className="ph ph-leaf text-[40px] text-text-faint" />
          <p className="text-sm text-text-muted mt-3">{t("fp.empty")}</p>
        </div>
      ) : (
        <>
          {/* Headline: fleet Blue Score with grade band */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 mb-5">
            <div className="bg-white border border-card-border rounded-2xl p-6 flex flex-col items-center justify-center" style={{ boxShadow: cardShadow }}>
              <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-3" style={mono}>{t("fp.blueScore")}</div>
              <Gauge score={avg} />
              <div className="mt-3 px-3 py-1 rounded-full text-[12px] font-semibold"
                style={{ background: band.color + "18", color: band.color }}>
                {band.label}
              </div>
              <p className="text-[11.5px] text-text-muted text-center leading-snug mt-3 max-w-[240px]">{band.desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 content-start">
              {[
                { label: t("fp.catches"), value: n, icon: "ph ph-fish" },
                { label: t("fp.landed"), value: `${Math.round(data?.total_kg ?? 0)} kg`, icon: "ph ph-scales" },
                { label: t("fp.greenShare"), value: `${data?.green_share_pct ?? 0}%`, icon: "ph ph-leaf" },
                { label: t("fp.closedSeason"), value: data?.closed_season_catches ?? 0, icon: "ph ph-prohibit" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-card-border rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: cardShadow }}>
                  <span className="w-10 h-10 flex-none rounded-xl bg-[#eaf3ef] text-accent flex items-center justify-center">
                    <i className={`${s.icon} text-[18px]`} />
                  </span>
                  <div>
                    <div className="text-[22px] font-bold text-text leading-none" style={serif}>{s.value}</div>
                    <div className="text-[10.5px] text-text-muted uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                </div>
              ))}

              {/* Score scale — where this fleet sits on the 0-100 range */}
              <div className="col-span-2 bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: cardShadow }}>
                <h3 className="text-sm font-semibold text-text mb-4" style={serif}>Where this sits on the scale</h3>
                <div className="relative">
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: "40%", background: "#c25a44" }} />
                    <div style={{ width: "30%", background: "#d49a2e" }} />
                    <div style={{ width: "30%", background: "#3a8c5f" }} />
                  </div>
                  <div className="absolute -top-1.5 w-[3px] h-[22px] rounded-full bg-text"
                    style={{ left: `calc(${Math.max(0, Math.min(100, avg))}% - 1.5px)` }} title={`Fleet average ${avg}`} />
                </div>
                <div className="flex justify-between text-[10px] text-text-faint mt-2.5" style={mono}>
                  <span>0 · high impact</span><span>40 · moderate</span><span>70 · sustainable</span><span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two dimensions: sustainability + compliance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: cardShadow }}>
              <h3 className="text-sm font-semibold text-text mb-1" style={serif}>{t("fp.sustainability")}</h3>
              <p className="text-[11px] text-text-faint mb-4">Ecological rating per landing — species, zone and bycatch risk.</p>
              <Bar total={n} segments={[
                { label: t("fp.sustainable"), value: data?.ratings.SUSTAINABLE ?? 0, color: "#3a8c5f" },
                { label: t("fp.moderate"), value: data?.ratings.MODERATE ?? 0, color: "#d49a2e" },
                { label: t("fp.highImpact"), value: data?.ratings.HIGH_IMPACT ?? 0, color: "#c25a44" },
              ]} />
            </div>
            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: cardShadow }}>
              <h3 className="text-sm font-semibold text-text mb-1" style={serif}>{t("fp.compliance")}</h3>
              <p className="text-[11px] text-text-faint mb-4">Legality is scored separately, so a healthy species isn&apos;t penalised for <i>when</i> it was landed.</p>
              <Bar total={n} segments={[
                { label: t("fp.compliant"), value: data?.compliant_catches ?? 0, color: "#3a8c5f" },
                { label: t("fp.closedSeason"), value: data?.closed_season_catches ?? 0, color: "#c25a44" },
              ]} />
            </div>
          </div>

          {/* Landings by species, straight off the ledger */}
          {bySpecies.length > 0 && (
            <div className="bg-white border border-card-border rounded-2xl p-5 mb-5" style={{ boxShadow: cardShadow }}>
              <h3 className="text-sm font-semibold text-text mb-1" style={serif}>Landings by species</h3>
              <p className="text-[11px] text-text-faint mb-4">Aggregated from every catch on the ledger.</p>
              <div className="space-y-3">
                {bySpecies.map((s) => (
                  <div key={s.species} className="flex items-center gap-3">
                    <div className="w-[150px] flex-none text-[12.5px] text-text truncate">{s.species}</div>
                    <div className="flex-1 h-5 rounded-md bg-[#f6f1e5] overflow-hidden">
                      <div className="h-full rounded-md" style={{ width: `${(s.kg / maxKg) * 100}%`, background: "linear-gradient(90deg,#2a6f7c,#3a8c5f)" }} />
                    </div>
                    <div className="w-[92px] flex-none text-right text-[12px] font-semibold text-text" style={mono}>{Math.round(s.kg)} kg</div>
                    <div className="w-[70px] flex-none text-right text-[11px] text-text-muted">{s.count} catch{s.count === 1 ? "" : "es"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Species conservation mix */}
          <div className="bg-white border border-card-border rounded-2xl p-5 mb-5" style={{ boxShadow: cardShadow }}>
            <h3 className="text-sm font-semibold text-text mb-1" style={serif}>{t("fp.speciesStatus")}</h3>
            <p className="text-[11px] text-text-faint mb-4">IUCN Red List status of everything landed. This is the single heaviest input to the score.</p>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(data?.species_status ?? {}).map(([label, count]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px]"
                  style={{ borderColor: (STATUS_COLOR[label] ?? "#8a9698") + "40", background: (STATUS_COLOR[label] ?? "#8a9698") + "12", color: STATUS_COLOR[label] ?? "#6d7e80" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[label] ?? "#8a9698" }} />
                  {label} <b>{count}</b>
                </span>
              ))}
            </div>
          </div>

          {/* What to do about it */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {actions.map((a) => (
              <div key={a.title} className="bg-white border border-card-border rounded-2xl p-5 flex items-start gap-3" style={{ boxShadow: cardShadow }}>
                <span className="w-9 h-9 flex-none rounded-xl flex items-center justify-center"
                  style={{ background: a.color + "18", color: a.color }}>
                  <i className={`${a.icon} text-[17px]`} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-[13.5px] font-semibold text-text leading-snug">{a.title}</h4>
                  <p className="text-[12px] text-text-secondary leading-relaxed mt-1">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* How the score works — always shown, it's the explainability of the page */}
      <div className="bg-white border border-card-border rounded-2xl p-5 md:p-6 mb-5" style={{ boxShadow: cardShadow }}>
        <h3 className="text-[15px] font-semibold text-text mb-1" style={serif}>How the Blue Score is calculated</h3>
        <p className="text-[12px] text-text-secondary leading-relaxed mb-5 max-w-3xl">
          A weighted average of three ecological inputs. Legality is deliberately kept out of it and reported on
          its own — a Least Concern species from a green zone shouldn&apos;t be graded as unsustainable purely because
          of the date it was landed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { w: "50%", name: "Species status", body: "IUCN Red List category of the species landed.", color: "#2a6f7c" },
            { w: "30%", name: "Fishing zone", body: "The SFZ class of where it was caught — green, amber or red.", color: "#3a8c5f" },
            { w: "20%", name: "Bycatch risk", body: "Gear-and-species bycatch likelihood, when reported.", color: "#d49a2e" },
          ].map((c) => (
            <div key={c.name} className="rounded-xl border border-card-border p-4" style={{ background: c.color + "0a" }}>
              <div className="text-[24px] font-bold leading-none" style={{ color: c.color, ...serif }}>{c.w}</div>
              <div className="text-[13px] font-semibold text-text mt-1.5">{c.name}</div>
              <p className="text-[11.5px] text-text-muted leading-snug mt-1">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-text-muted mb-2.5" style={mono}>Species status → points</div>
            <div className="space-y-1.5">
              {IUCN_POINTS.map((s) => (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="w-[30px] flex-none text-[10px] font-bold text-text-muted" style={mono}>{s.code}</span>
                  <span className="flex-1 text-[12px] text-text-secondary truncate">{s.label}</span>
                  <div className="w-[90px] flex-none h-1.5 rounded-full bg-[#f0ebdf] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pts}%`, background: STATUS_COLOR[s.label] ?? "#8a9698" }} />
                  </div>
                  <span className="w-[30px] flex-none text-right text-[11.5px] font-semibold text-text" style={mono}>{s.pts}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-text-muted mb-2.5" style={mono}>Fishing zone → points</div>
            <div className="space-y-1.5">
              {ZONE_POINTS.map((z) => (
                <div key={z.code} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 flex-none rounded-full" style={{ background: z.color }} />
                  <span className="w-[52px] flex-none text-[10px] font-bold text-text-muted" style={mono}>{z.code}</span>
                  <span className="flex-1 text-[12px] text-text-secondary truncate">{z.label}</span>
                  <div className="w-[90px] flex-none h-1.5 rounded-full bg-[#f0ebdf] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.pts}%`, background: z.color }} />
                  </div>
                  <span className="w-[30px] flex-none text-right text-[11.5px] font-semibold text-text" style={mono}>{z.pts}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] uppercase tracking-[0.1em] text-text-muted mt-5 mb-2.5" style={mono}>Reported separately</div>
            <div className="space-y-1.5 text-[12px] text-text-secondary">
              <div className="flex items-center gap-2"><i className="ph ph-check-circle text-[14px] text-[#3a8c5f]" /> Open season, outside no-take zones</div>
              <div className="flex items-center gap-2"><i className="ph ph-prohibit text-[14px] text-[#c25a44]" /> Monsoon closed season (state-wise dates)</div>
              <div className="flex items-center gap-2"><i className="ph ph-shield-warning text-[14px] text-[#a5342a]" /> Inside a declared no-take marine area</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[0.62rem] text-text-faint">{t("fp.method")}</div>
    </div>
  );
}
