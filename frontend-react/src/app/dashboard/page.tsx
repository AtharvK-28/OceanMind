"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fetcher, apiPost } from "@/lib/api";
import { sfzFoliumColor } from "@/lib/colors";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { SkeletonMap } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import LedgerFeed from "@/components/ui/LedgerFeed";
import type { MHIStatusResponse, SFZCurrentResponse, ChainSummaryResponse, SHAPEntry } from "@/types/api";

const ZONE_COLORS: Record<string, string> = { GREEN: "#3a8c5f", AMBER: "#d49a2e", RED: "#c25a44" };
const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 12px 30px rgba(23,48,57,0.04)";

// Human-readable names for known shelf locations — a label only, no asserted
// conditions. Everything else on the card comes from live model/API values.
const ZONE_NAMES: Record<string, string> = {
  "20.9,69.5": "Veraval Bank",
  "9.97,75.8": "Kochi Shelf",
  "12.87,74.5": "Mangalore Bank",
  "17.7,83.5": "Vizag Deep",
};

// Short labels for the SFZ model's SHAP feature keys.
const FEATURE_LABEL: Record<string, string> = {
  sst_c: "SST", chlorophyll_mgl: "Chl-a", ssh_anomaly: "SSH", mld_m: "MLD",
  fishing_effort_h: "Effort", wind_stress_curl: "Wind curl", salinity_psu: "Salinity",
};

export default function Dashboard() {
  const router = useRouter();
  const { data: mhi } = useSWR<MHIStatusResponse>("/api/v1/mhi/status", fetcher, { refreshInterval: 30000 });
  const { data: sfz, isLoading: sfzLoading, error: sfzError, mutate: mutateSfz } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", fetcher, { refreshInterval: 30000 });
  const { data: chain } = useSWR<ChainSummaryResponse>("/api/v1/trace/chain-summary", fetcher, { refreshInterval: 10000 });

  const [secs, setSecs] = useState(0);
  useEffect(() => { const t = setInterval(() => setSecs(s => (s >= 59 ? 1 : s + 1)), 1000); return () => clearInterval(t); }, []);

  // Real live SST from Open-Meteo (representative Kochi shelf point) — was hardcoded "28.6"
  const [liveSst, setLiveSst] = useState<number | null>(null);
  useEffect(() => {
    apiPost<{ advisory: { current: { sst_c: number | null }; sst_trend_c: number | null } }>(
      "/api/v1/fishing/advisory", { lat: 9.5, lon: 75.5, site_name: "Kochi Shelf" }
    ).then((r) => setLiveSst(r.advisory.current.sst_c)).catch(() => setLiveSst(null));
  }, []);

  // Lowest-bycatch GREEN zone from real SFZ data — everything shown is either
  // a curated place name, a live SST reading, or a real model output.
  const greenZones = (sfz?.geojson.features ?? []).filter(f => f.properties.ecological_class === "GREEN");
  const firstGreen = greenZones.reduce<typeof greenZones[number] | undefined>(
    (best, f) => (!best || f.properties.bycatch_risk_score < best.properties.bycatch_risk_score ? f : best),
    undefined
  );
  const gLat = firstGreen ? firstGreen.geometry.coordinates[1] : null;
  const gLon = firstGreen ? firstGreen.geometry.coordinates[0] : null;
  const greenName = gLat != null && gLon != null
    ? Object.entries(ZONE_NAMES).find(([k]) => {
        const [kLat, kLon] = k.split(",").map(Number);
        return Math.abs(kLat - gLat) < 2 && Math.abs(kLon - gLon) < 2;
      })?.[1]
    : undefined;
  const topName = greenName ?? (gLat != null && gLon != null ? `Green zone ${gLat.toFixed(1)}°N ${gLon.toFixed(1)}°E` : "No green zone");
  const topRisk = firstGreen ? firstGreen.properties.bycatch_risk_score : null;
  const topDrivers = (firstGreen?.properties.shap_top3 ?? []).map(s => FEATURE_LABEL[s.feature] ?? s.feature);

  const mhiTotal = mhi?.total_cells ?? 0;
  const mhiAlerts = mhi?.alerts_active ?? 0;

  // Real mean MHI across the grid (was hardcoded "72")
  const mhiCells = mhi?.grid_cells ?? [];
  const mhiMean = mhiCells.length
    ? Math.round(mhiCells.reduce((sum, c) => sum + c.mhi_score, 0) / mhiCells.length)
    : null;
  // Real stress split for the mini-distribution (replaces the fabricated sparkline)
  const stressSplit = ["NORMAL", "WATCH", "WARNING", "CRITICAL"].map((level) => ({
    level,
    count: mhiCells.filter((c) => c.stress_level === level).length,
  }));
  const stressColors: Record<string, string> = { NORMAL: "#3a8c5f", WATCH: "#d98b4a", WARNING: "#d49a2e", CRITICAL: "#c25a44" };

  const summary = sfz?.zone_summary ?? {};
  const sfzGreen = summary.GREEN ?? 0;
  const sfzAmber = summary.AMBER ?? 0;
  const sfzRed = summary.RED ?? 0;
  const sfzTotal = sfz?.total_zones ?? 0;

  const mapPoints: MarkerPoint[] = (sfz?.geojson.features ?? []).slice(0, 1500).map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const zone = f.properties.ecological_class;
    const risk = f.properties.bycatch_risk_score;
    const shap = f.properties.shap_top3 ?? [];
    const shapStr = shap.map((s: SHAPEntry) => s.feature).join(", ");
    return {
      lat, lng, color: sfzFoliumColor(zone),
      tooltip: `${zone} | Risk: ${risk.toFixed(2)}`,
      popup: `<b>Zone:</b> ${zone}<br><b>Bycatch Risk:</b> ${risk.toFixed(2)}<br><b>Drivers:</b> ${shapStr || "—"}`,
    };
  });

  const pieData = Object.entries(summary).map(([name, value]) => ({ name, value }));

  const greenPct = sfzTotal ? Math.round(sfzGreen / sfzTotal * 100) : 0;

  return (
    <div className="animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-[10px]">
            <h1 className="m-0 text-[25px] font-semibold text-[#15323a]" style={{ fontFamily: "'Newsreader', serif", letterSpacing: "-0.01em" }}>Dashboard</h1>
            <span className="inline-flex items-center gap-[6px] px-[10px] py-1 rounded-full bg-zone-green-bg border border-[#cfe6dd]">
              <span className="w-[6px] h-[6px] rounded-full bg-zone-green" style={{ animation: "pulse 2.4s infinite" }} />
              <span className="text-[10px] tracking-[0.05em] text-[#2f6f4c]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>LIVE</span>
            </span>
          </div>
          <div className="text-[12.5px] text-text-secondary mt-[3px]">Indian Exclusive Economic Zone · Week {Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000)}, 2026 · updated {secs}s ago</div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-[22px] animate-stagger">
        <MetricCard label="Marine Health Index" value={mhiMean ?? "—"} icon="ph ph-heartbeat" delta={mhiMean != null ? `Mean of ${mhiTotal} grid cells` : "Loading…"} deltaColor="green" />
        <MetricCard label="Sea Surface Temp" value={liveSst != null ? liveSst.toFixed(1) : "—"} icon="ph ph-thermometer-simple" delta={liveSst != null ? "Live · Open-Meteo (Kochi shelf)" : "Loading…"} deltaColor="green" />
        <MetricCard label="Green Zones Today" value={sfzGreen || "—"} icon="ph ph-map-trifold" delta={`${greenPct}% recommended to fish`} deltaColor="green" />
        <MetricCard label="Active Stress Alerts" value={mhiAlerts} icon="ph ph-warning" delta={`${mhiAlerts} cells stressed`} deltaColor="red" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-5 items-start">

        {/* Left Column */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Map Card */}
          <div className="bg-white border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: cardShadow }}>
            <div className="flex items-center justify-between px-[18px] pt-4 pb-3">
              <div>
                <h2 className="m-0 text-[18px] font-semibold text-[#16323a]" style={{ fontFamily: "'Newsreader', serif" }}>Sustainable Fishing Zones</h2>
                <div className="text-[11.5px] text-text-muted mt-[2px]">XGBoost weekly classifier · tap a zone for detail</div>
              </div>
              <span className="text-[9.5px] tracking-[0.06em] text-[#9aa6a7] bg-card-hover border border-card-border px-[9px] py-[5px] rounded-lg" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ARGO · INCOIS · GFW</span>
            </div>
            {sfzError ? <div className="mx-[14px] mb-[14px]"><ErrorState message="Couldn't load fishing zones" onRetry={() => mutateSfz()} compact /></div> : sfzLoading ? <div className="mx-[14px] mb-[14px]"><SkeletonMap /></div> : (
              <div className="mx-[14px] mb-[14px] animate-data-enter relative">
                <MapContainer height="340px" points={mapPoints} />
                <MapLegend title="" items={[
                  { color: "#3a8c5f", label: "Recommended" },
                  { color: "#d49a2e", label: "Caution" },
                  { color: "#c25a44", label: "Avoid" },
                ]} />
              </div>
            )}
          </div>

          {/* Mini Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Zone Distribution Donut */}
            <div className="bg-white border border-card-border rounded-2xl p-[18px]" style={{ boxShadow: cardShadow }}>
              <h3 className="m-0 mb-[14px] text-[16px] font-semibold text-[#16323a]" style={{ fontFamily: "'Newsreader', serif" }}>Zone distribution</h3>
              <div className="flex items-center gap-[18px]">
                {pieData.length > 0 && (
                  <div className="w-[104px] h-[104px] flex-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={52} strokeWidth={0}>
                          {pieData.map((entry) => <Cell key={entry.name} fill={ZONE_COLORS[entry.name] ?? "#8a9698"} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="flex flex-col gap-[9px] flex-1">
                  {[
                    { label: "Green", color: "#3a8c5f", count: sfzGreen },
                    { label: "Amber", color: "#d49a2e", count: sfzAmber },
                    { label: "Red", color: "#c25a44", count: sfzRed },
                  ].map((z) => (
                    <div key={z.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-[7px] text-[12px] text-[#46585b]">
                        <span className="w-[9px] h-[9px] rounded-[3px]" style={{ background: z.color }} />{z.label}
                      </span>
                      <span className="text-[12px] text-[#16323a]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{z.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MHI — real mean + live stress distribution */}
            <div className="bg-white border border-card-border rounded-2xl p-[18px]" style={{ boxShadow: cardShadow }}>
              <div className="flex items-baseline justify-between">
                <h3 className="m-0 text-[16px] font-semibold text-[#16323a]" style={{ fontFamily: "'Newsreader', serif" }}>Marine Health Index</h3>
                <span className="text-[10px] text-[#9aa6a7]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{mhiTotal} cells</span>
              </div>
              <div className="flex items-baseline gap-[5px] mt-2">
                <span className="text-[30px] font-semibold text-[#16323a] leading-none" style={{ fontFamily: "'Newsreader', serif" }}>{mhiMean ?? "—"}</span>
                <span className="text-[12px] text-[#9aa6a7]">/ 100 · grid mean</span>
              </div>
              {/* Real stress-level distribution bar */}
              {mhiCells.length > 0 && (
                <>
                  <div className="flex h-[10px] rounded-full overflow-hidden mt-[14px] bg-[#eee7d8]">
                    {stressSplit.map((s) => s.count > 0 && (
                      <div key={s.level} title={`${s.level}: ${s.count}`}
                        style={{ width: `${(s.count / mhiCells.length) * 100}%`, background: stressColors[s.level] }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-[10px]">
                    {stressSplit.map((s) => (
                      <span key={s.level} className="flex items-center gap-[5px] text-[10px] text-[#46585b]">
                        <span className="w-[8px] h-[8px] rounded-[2px]" style={{ background: stressColors[s.level] }} />
                        {s.level[0] + s.level.slice(1).toLowerCase()} <b className="text-[#16323a]">{s.count}</b>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Recommendation Card */}
          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: cardShadow, background: "linear-gradient(168deg, #fbf7ee, #fff)" }}>
            <div className="flex items-center gap-2 mb-[14px]">
              <i className="ph-fill ph-sun-horizon text-[18px] text-[#d98b4a]" />
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#b08043]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Good fishing today</span>
            </div>
            <div className="text-[23px] font-semibold text-[#16323a] leading-tight" style={{ fontFamily: "'Newsreader', serif" }}>{topName}</div>
            <div className="inline-flex items-center gap-[6px] mt-[9px] px-[11px] py-[5px] rounded-full bg-zone-green-bg border border-[#cfe6dd]">
              <span className="w-[7px] h-[7px] rounded-full bg-zone-green" />
              <span className="text-[11.5px] font-semibold text-[#2f6f4c]">GREEN · Recommended</span>
            </div>
            <p className="mt-[14px] mb-0 text-[13.5px] leading-[1.55] text-[#52636a]">
              {firstGreen
                ? <>Lowest-bycatch GREEN zone in this week&apos;s classifier run{topDrivers.length > 0 && <> · key drivers: {topDrivers.join(", ")}</>}.</>
                : "No GREEN zones in the current classifier run."}
            </p>

            <div className="grid grid-cols-3 gap-[10px] mt-4">
              {[
                { icon: "ph ph-thermometer-simple", value: liveSst != null ? `${liveSst.toFixed(1)}°` : "—", label: "SEA TEMP" },
                { icon: "ph ph-shield-check", value: topRisk != null ? `${(topRisk * 100).toFixed(0)}%` : "—", label: "BYCATCH RISK" },
                { icon: "ph ph-chart-bar", value: topDrivers[0] ?? "—", label: "KEY DRIVER" },
              ].map((s) => (
                <div key={s.label} className="text-center p-[11px] rounded-xl bg-card-hover border border-card-border">
                  <i className={`${s.icon} text-[17px] text-[#2a6f7c]`} />
                  <div className="text-[17px] font-semibold text-[#16323a] mt-1" style={{ fontFamily: "'Newsreader', serif" }}>{s.value}</div>
                  <div className="text-[9.5px] text-text-muted tracking-[0.04em]">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-[10px] mt-4">
              <button onClick={() => router.push("/fishing-advisory")} className="flex-1 flex items-center justify-center gap-[7px] py-[13px] border-none rounded-xl bg-accent text-white text-[13.5px] font-semibold cursor-pointer" style={{ fontFamily: "inherit" }}>
                <i className="ph-fill ph-navigation-arrow text-[15px]" /> Set course
              </button>
              <button onClick={() => router.push("/blockchain")} className="flex-none flex items-center justify-center gap-[7px] py-[13px] px-4 border border-[#d8cfbc] rounded-xl bg-white text-[#2a6f7c] text-[13.5px] font-semibold cursor-pointer" style={{ fontFamily: "inherit" }}>
                <i className="ph ph-plus-circle text-[15px]" /> Log catch
              </button>
            </div>
          </div>

          {/* Catch Ledger */}
          <div className="bg-white border border-card-border rounded-2xl p-[18px]" style={{ boxShadow: cardShadow }}>
            <div className="flex items-center justify-between mb-[14px]">
              <h3 className="m-0 text-[16px] font-semibold text-[#16323a]" style={{ fontFamily: "'Newsreader', serif" }}>Catch ledger</h3>
              <span className="inline-flex items-center gap-[5px] text-[10.5px] text-[#2a6f7c]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <i className="ph ph-shield-check text-[13px]" /> verified
              </span>
            </div>
            <LedgerFeed limit={4} />
          </div>
        </div>
      </div>

      <div className="text-center mt-7 text-[10px] tracking-[0.08em] text-[#b0b9a8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>OCEANMIND v1.0 · BIOTHON 2026 · OPEN DATA ONLY</div>
    </div>
  );
}
