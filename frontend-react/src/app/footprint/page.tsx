"use client";
import useSWR from "swr";
import { apiGet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import HeroBanner from "@/components/ui/HeroBanner";
import ErrorState from "@/components/ui/ErrorState";

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

export default function FootprintPage() {
  const { t } = useI18n();
  const { data, error, mutate } = useSWR<Summary>("/api/v1/footprint/summary", fetcher, { refreshInterval: 15000 });

  const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";
  const n = data?.total_catches ?? 0;
  const avg = data?.avg_score ?? 0;

  return (
    <div className="animate-page-enter">
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
          {/* Headline: fleet Blue Score */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 mb-5">
            <div className="bg-white border border-card-border rounded-2xl p-6 flex flex-col items-center justify-center" style={{ boxShadow: cardShadow }}>
              <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{t("fp.blueScore")}</div>
              <div className="text-[64px] font-black leading-none" style={{ color: scoreColor(avg), fontFamily: "'Newsreader', serif" }}>{avg}</div>
              <div className="text-[12px] text-text-faint mt-1">/ 100</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <div className="text-[22px] font-bold text-text leading-none" style={{ fontFamily: "'Newsreader', serif" }}>{s.value}</div>
                    <div className="text-[10.5px] text-text-muted uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two dimensions: sustainability + compliance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: cardShadow }}>
              <h3 className="text-sm font-semibold text-text mb-4" style={{ fontFamily: "'Newsreader', serif" }}>{t("fp.sustainability")}</h3>
              <Bar total={n} segments={[
                { label: t("fp.sustainable"), value: data?.ratings.SUSTAINABLE ?? 0, color: "#3a8c5f" },
                { label: t("fp.moderate"), value: data?.ratings.MODERATE ?? 0, color: "#d49a2e" },
                { label: t("fp.highImpact"), value: data?.ratings.HIGH_IMPACT ?? 0, color: "#c25a44" },
              ]} />
            </div>
            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: cardShadow }}>
              <h3 className="text-sm font-semibold text-text mb-4" style={{ fontFamily: "'Newsreader', serif" }}>{t("fp.compliance")}</h3>
              <Bar total={n} segments={[
                { label: t("fp.compliant"), value: data?.compliant_catches ?? 0, color: "#3a8c5f" },
                { label: t("fp.closedSeason"), value: data?.closed_season_catches ?? 0, color: "#c25a44" },
              ]} />
            </div>
          </div>

          {/* Species conservation mix */}
          <div className="bg-white border border-card-border rounded-2xl p-5 mb-5" style={{ boxShadow: cardShadow }}>
            <h3 className="text-sm font-semibold text-text mb-4" style={{ fontFamily: "'Newsreader', serif" }}>{t("fp.speciesStatus")}</h3>
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
        </>
      )}

      <div className="text-center text-[0.62rem] text-text-faint">{t("fp.method")}</div>
    </div>
  );
}
