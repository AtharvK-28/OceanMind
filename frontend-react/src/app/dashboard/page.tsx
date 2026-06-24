"use client";
import useSWR from "swr";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fetcher } from "@/lib/api";
import { sfzFoliumColor } from "@/lib/colors";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { SkeletonMap, SkeletonRow } from "@/components/ui/Skeleton";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import type { MHIStatusResponse, SFZCurrentResponse, ChainSummaryResponse, SHAPEntry } from "@/types/api";

const ZONE_COLORS: Record<string, string> = { GREEN: "#4caf50", AMBER: "#ff9800", RED: "#f44336" };

export default function Dashboard() {
  const { data: mhi } = useSWR<MHIStatusResponse>("/api/v1/mhi/status", fetcher, { refreshInterval: 30000 });
  const { data: sfz, isLoading: sfzLoading } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", fetcher, { refreshInterval: 30000 });
  const { data: chain } = useSWR<ChainSummaryResponse>("/api/v1/trace/chain-summary", fetcher, { refreshInterval: 10000 });

  const mhiTotal = mhi?.total_cells ?? 0;
  const mhiAlerts = mhi?.alerts_active ?? 0;
  const summary = sfz?.zone_summary ?? {};
  const sfzGreen = summary.GREEN ?? 0;
  const sfzTotal = sfz?.total_zones ?? 0;

  const mapPoints: MarkerPoint[] = (sfz?.geojson.features ?? []).slice(0, 1500).map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const zone = f.properties.ecological_class;
    const risk = f.properties.bycatch_risk_score;
    const shap = f.properties.shap_top3 ?? [];
    const shapStr = shap.map((s: SHAPEntry) => s.feature).join(", ");
    return {
      lat, lng,
      color: sfzFoliumColor(zone),
      tooltip: `${zone} | Risk: ${risk.toFixed(2)}`,
      popup: `<b>Zone:</b> ${zone}<br><b>Bycatch Risk:</b> ${risk.toFixed(2)}<br><b>Drivers:</b> ${shapStr || "—"}`,
    };
  });

  const pieData = Object.entries(summary).map(([name, value]) => ({ name, value }));

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="🌊 OceanMind Dashboard"
        description='<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:#4caf50;animation:pulse 2s infinite"></span> <span style="font-size:0.75rem;opacity:0.6">LIVE — auto-refreshing every 30s</span></span><br/>AI-Driven Unified Marine Data Intelligence &mdash; Indian Exclusive Economic Zone'
        stats={[
          { value: mhiTotal, label: "MHI Grid Cells" },
          { value: mhiAlerts, label: "Stress Alerts", color: "#ef5350" },
          { value: sfzGreen, label: "Green Zones", color: "#66bb6a" },
          { value: sfzTotal, label: "Total SFZ" },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-stagger">
        <MetricCard label="🌡️ MHI Grid Cells" value={mhiTotal} />
        <MetricCard label="🚨 Active Alerts" value={mhiAlerts} delta={`${mhiAlerts} cells stressed`} deltaColor="red" />
        <MetricCard label="🟢 Green Zones" value={sfzGreen} />
        <MetricCard label="🔴 Red Zones" value={summary.RED ?? 0} delta={`avoid ${summary.RED ?? 0} zones`} deltaColor="red" />
      </div>

      <h2 className="text-lg font-semibold mb-3 text-white/90">🗺️ Indian EEZ — Sustainable Fishing Zones</h2>
      {sfzLoading ? <SkeletonMap /> : (
        <div className="animate-data-enter relative">
          <MapContainer height="480px" points={mapPoints} />
          <MapLegend title="Fishing Zone" items={[
            { color: "#4caf50", label: "GREEN — Recommended" },
            { color: "#ff9800", label: "AMBER — Caution" },
            { color: "#f44336", label: "RED — Avoid" },
          ]} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Donut chart */}
        <div className="bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Zone Distribution</h3>
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={0}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={ZONE_COLORS[entry.name] ?? "#9e9e9e"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Zone table */}
        <div className="bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Zone Summary</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                { zone: "🟢 GREEN", count: summary.GREEN ?? 0, action: "Safe to fish" },
                { zone: "🟡 AMBER", count: summary.AMBER ?? 0, action: "Fish with caution" },
                { zone: "🔴 RED", count: summary.RED ?? 0, action: "Avoid" },
              ].map((r) => (
                <tr key={r.zone} className="border-b border-white/5">
                  <td className="py-2.5 font-medium text-white/80">{r.zone}</td>
                  <td className="py-2.5 text-white/60 text-right">{r.count}</td>
                  <td className="py-2.5 text-white/50 text-right text-xs">{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Blockchain summary */}
        <div className="bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">⛓️ Catch Ledger</h3>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-white">{chain?.total_blocks ?? 0}</div>
              <div className="text-xs text-white/50">Total Blocks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{chain?.total_catch_records ?? 0}</div>
              <div className="text-xs text-white/50">Catch Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{chain?.species_logged?.length ?? 0}</div>
              <div className="text-xs text-white/50">Species Logged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
