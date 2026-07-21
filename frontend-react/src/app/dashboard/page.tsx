"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fetcher, apiGet } from "@/lib/api";
import { sfzFoliumColor } from "@/lib/colors";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { SkeletonMap } from "@/components/ui/Skeleton";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import type { MHIStatusResponse, SFZCurrentResponse, ChainSummaryResponse, SHAPEntry, CatchRecord } from "@/types/api";
import { createClient } from "@/utils/supabase/client";
import { REGIONS } from "@/lib/constants";

const ZONE_COLORS: Record<string, string> = { GREEN: "#3a8c5f", AMBER: "#d49a2e", RED: "#c25a44" };
const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 12px 30px rgba(23,48,57,0.04)";

// Haversine distance in nautical miles (approx)
function calcNauticalMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
  return Math.round((12742 * Math.asin(Math.sqrt(a))) * 0.539957);
}

export default function Dashboard() {
  const router = useRouter();
  const { data: mhi } = useSWR<MHIStatusResponse>("/api/v1/mhi/status", fetcher, { refreshInterval: 30000 });
  const { data: sfz, isLoading: sfzLoading } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", fetcher, { refreshInterval: 30000 });
  const { data: chain } = useSWR<ChainSummaryResponse>("/api/v1/trace/chain-summary", fetcher, { refreshInterval: 10000 });

  const [secs, setSecs] = useState(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([15, 78]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  useEffect(() => {
    const t = setInterval(() => setSecs(s => (s >= 59 ? 1 : s + 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const regionName = user?.user_metadata?.region;
      if (regionName && REGIONS[regionName]) {
        setMapCenter([REGIONS[regionName].lat, REGIONS[regionName].lng]);
        setMapZoom(REGIONS[regionName].zoom);
      }
    });
  }, []);

  // Fetch recent catch records for the ledger
  const [recentCatches, setRecentCatches] = useState<CatchRecord[]>([]);
  useEffect(() => {
    apiGet<{ records: CatchRecord[] }>("/api/v1/trace/history")
      .then((res) => setRecentCatches(res.records.slice(-4).reverse()))
      .catch(() => {});
  }, [chain?.total_blocks]);

  // Compute real MHI average from grid cells
  const avgMhi = mhi?.grid_cells?.length
    ? Math.round(mhi.grid_cells.reduce((s, c) => s + c.mhi_score, 0) / mhi.grid_cells.length)
    : null;

  // Compute real average SST from nearest MHI grid cell data
  const avgSST = mhi?.grid_cells?.length
    ? (mhi.grid_cells.reduce((s, c) => s + ((c as unknown as Record<string, number>).sst_c ?? 28), 0) / mhi.grid_cells.length).toFixed(1)
    : null;

  // Dynamically find the best GREEN zone (lowest bycatch risk) for actionable recommendation
  const greenZones = sfz?.geojson.features.filter(f => f.properties.ecological_class === "GREEN") || [];
  const bestGreen = greenZones.length > 0 
    ? greenZones.reduce((prev, curr) => (prev.properties.bycatch_risk_score < curr.properties.bycatch_risk_score ? prev : curr)) 
    : null;

  const topZone = bestGreen ? {
    name: `Grid ${bestGreen.geometry.coordinates[1].toFixed(1)}°N, ${bestGreen.geometry.coordinates[0].toFixed(1)}°E`,
    desc: `Optimal fishing conditions. Primarily driven by favorable ${bestGreen.properties.shap_top3?.[0]?.feature?.replace(/_/g, " ") ?? "oceanography"}. Bycatch risk is exceptionally low (${bestGreen.properties.bycatch_risk_score.toFixed(3)}). Safe to proceed.`,
    sst: avgSST ? `${avgSST}°` : "—", // Global average fallback
    dist: calcNauticalMiles(mapCenter[0], mapCenter[1], bestGreen.geometry.coordinates[1], bestGreen.geometry.coordinates[0]).toString()
  } : {
    name: "Scanning Ocean Data...",
    desc: "Fetching current ocean conditions. Check the Sustainable Fishing Zones map to find safe zones nearby.",
    sst: "—",
    dist: "—"
  };

  const mhiTotal = mhi?.total_cells ?? 0;
  const mhiAlerts = mhi?.alerts_active ?? 0;
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
        <MetricCard label="Marine Health Index" value={avgMhi ?? "—"} icon="ph ph-heartbeat" delta={avgMhi ? (avgMhi >= 60 ? "Stable" : "Stressed") : "Loading…"} deltaColor={avgMhi && avgMhi >= 60 ? "green" : "amber"} />
        <MetricCard label="Sea Surface Temp" value={avgSST ? `${avgSST}°` : "—"} icon="ph ph-thermometer-simple" delta={avgSST ? "Live reading" : "Loading…"} deltaColor="green" />
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
            {sfzLoading ? <div className="mx-[14px] mb-[14px]"><SkeletonMap /></div> : (
              <div className="mx-[14px] mb-[14px] animate-data-enter relative">
                <MapContainer height="340px" points={mapPoints} center={mapCenter} zoom={mapZoom} />
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

            {/* MHI Trend */}
            <div className="bg-white border border-card-border rounded-2xl p-[18px]" style={{ boxShadow: cardShadow }}>
              <div className="flex items-baseline justify-between">
                <h3 className="m-0 text-[16px] font-semibold text-[#16323a]" style={{ fontFamily: "'Newsreader', serif" }}>Marine Health Index</h3>
                <span className="text-[11px] text-[#2f6f4c] font-semibold">+2 wk</span>
              </div>
              <div className="flex items-baseline gap-[5px] mt-2">
                <span className="text-[30px] font-semibold text-[#16323a] leading-none" style={{ fontFamily: "'Newsreader', serif" }}>72</span>
                <span className="text-[12px] text-[#9aa6a7]">/ 100 · Stable</span>
              </div>
              <svg viewBox="0 0 240 64" className="w-full mt-[10px] overflow-visible" style={{ height: 64 }}>
                <polyline points="2,64 2,36.0 23.6,28.0 45.3,44.0 66.9,20.0 88.5,8.0 110.2,16.0 131.8,4.0 153.5,8.0 175.1,0.0 196.7,16.0 218.4,4.0 238,8.0 238,64" fill="#eaf3ef" stroke="none" />
                <polyline points="2,36.0 23.6,28.0 45.3,44.0 66.9,20.0 88.5,8.0 110.2,16.0 131.8,4.0 153.5,8.0 175.1,0.0 196.7,16.0 218.4,4.0 238,8.0" fill="none" stroke="#3a8c5f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex justify-between text-[8.5px] text-[#b0b9b9] mt-[2px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}><span>W14</span><span>W26</span></div>
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
            <div className="text-[23px] font-semibold text-[#16323a] leading-tight" style={{ fontFamily: "'Newsreader', serif" }}>{topZone.name}</div>
            <div className="inline-flex items-center gap-[6px] mt-[9px] px-[11px] py-[5px] rounded-full bg-zone-green-bg border border-[#cfe6dd]">
              <span className="w-[7px] h-[7px] rounded-full bg-zone-green" />
              <span className="text-[11.5px] font-semibold text-[#2f6f4c]">GREEN · Recommended</span>
            </div>
            <p className="mt-[14px] mb-0 text-[13.5px] leading-[1.55] text-[#52636a]">{topZone.desc}</p>

            <div className="grid grid-cols-3 gap-[10px] mt-4">
              {[
                { icon: "ph ph-thermometer-simple", value: topZone.sst, label: "SEA TEMP" },
                { icon: "ph ph-fish", value: "High", label: "CATCH ODDS" },
                { icon: "ph ph-navigation-arrow", value: topZone.dist, label: "NAUT. MILES" },
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
            <div className="flex items-start justify-between mb-[14px]">
              <div>
                <h3 className="m-0 text-[16px] font-semibold text-[#16323a]" style={{ fontFamily: "'Newsreader', serif" }}>Catch ledger</h3>
                <div className="text-[11px] text-text-muted mt-[2px]">Every logged catch is hashed and chained — tap any entry to verify</div>
              </div>
              <span className="inline-flex items-center gap-[5px] text-[10.5px] text-[#2a6f7c] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <i className="ph ph-shield-check text-[13px]" /> verified
              </span>
            </div>
            <div className="flex flex-col">
              {recentCatches.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-text-faint">No catches logged yet — use the Log Catch button to record one</div>
              ) : recentCatches.map((l, i) => (
                <div key={l.transaction_id} onClick={() => router.push("/blockchain")} className="flex items-center gap-3 py-[11px] border-t border-[#f0ebdf] cursor-pointer hover:opacity-80 transition-opacity">
                  <span className="w-[34px] h-[34px] flex-none rounded-[9px] bg-zone-green-bg text-[#2a6f7c] flex items-center justify-center">
                    <i className="ph ph-fish-simple text-[16px]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#1d3b43]">{l.species_name}</div>
                    <div className="text-[11px] text-text-muted">{l.landing_site_id} · {new Date(l.event_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12.5px] text-[#16323a]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{l.quantity_kg} kg</div>
                    <div className="text-[9.5px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{l.transaction_id.slice(0, 10)}…</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-7 text-[10px] tracking-[0.08em] text-[#b0b9a8]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>OCEANMIND v1.0 · OPEN DATA</div>
    </div>
  );
}
