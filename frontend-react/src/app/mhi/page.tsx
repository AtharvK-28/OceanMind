"use client";
import { useState } from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetcher, apiPost } from "@/lib/api";
import { mhiColor, stressColor } from "@/lib/colors";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ResultBadge from "@/components/ui/ResultBadge";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import type { MHIStatusResponse, MHIScoreResponse } from "@/types/api";
import InsightCard from "@/components/ui/InsightCard";
import AdvancedPanel from "@/components/ui/AdvancedPanel";

function interpretMHI(alertsActive: number, totalCells: number): { severity: "good"|"watch"|"warning"|"critical"; headline: string; body: string } {
  const pct = totalCells ? (alertsActive / totalCells) * 100 : 0;
  if (pct === 0) return {
    severity: "good",
    headline: "Marine health is stable across the monitored EEZ.",
    body: "No grid cells are currently flagged for stress. SST, oxygen, and chlorophyll readings from ARGO floats are within normal seasonal range.",
  };
  if (pct < 5) return {
    severity: "watch",
    headline: `A small number of zones (${alertsActive} of ${totalCells}) are showing early stress signals.`,
    body: "Likely localized — worth a second look next week, not yet a systemic concern.",
  };
  if (pct < 15) return {
    severity: "warning",
    headline: `${alertsActive} of ${totalCells} monitored zones are under active stress.`,
    body: "This is enough to affect fish distribution in the coming weeks — check the map below for which coastal stretch is affected.",
  };
  return {
    severity: "critical",
    headline: `Widespread marine stress detected — ${alertsActive} of ${totalCells} zones flagged.`,
    body: "This pattern is consistent with a marine heatwave or oxygen-minimum-zone expansion. Recommend cross-checking against the Digital Twin scenario tool.",
  };
}

export default function MHIPage() {
  const [bbox, setBbox] = useState({ lat_min: "5", lat_max: "25", lon_min: "60", lon_max: "100" });
  const { data, isLoading } = useSWR<MHIStatusResponse>(
    `/api/v1/mhi/status?lat_min=${bbox.lat_min}&lat_max=${bbox.lat_max}&lon_min=${bbox.lon_min}&lon_max=${bbox.lon_max}`,
    fetcher
  );

  const [form, setForm] = useState({ sst_c: 28.5, chlorophyll_mgl: 0.3, dissolved_o2: 200, ph: 8.1, salinity_psu: 34.5 });
  const [score, setScore] = useState<MHIScoreResponse | null>(null);
  const [scoring, setScoring] = useState(false);

  const mapPoints: MarkerPoint[] = (data?.grid_cells ?? []).map((c) => ({
    lat: c.latitude, lng: c.longitude,
    color: mhiColor(c.mhi_score),
    tooltip: `MHI ${c.mhi_score.toFixed(0)} | ${c.stress_level}`,
    popup: `<b>MHI:</b> ${c.mhi_score.toFixed(1)}<br><b>Stress:</b> ${c.stress_level}<br><b>Alert:</b> ${c.alert ? "YES" : "No"}`,
  }));

  const histogram = ["CRITICAL", "WARNING", "WATCH", "NORMAL"].map((level) => ({
    name: level,
    count: data?.grid_cells.filter((c) => c.stress_level === level).length ?? 0,
    fill: stressColor(level),
  }));

  async function handleScore(e: React.FormEvent) {
    e.preventDefault();
    setScoring(true);
    try { setScore(await apiPost<MHIScoreResponse>("/api/v1/mhi/score", form)); }
    finally { setScoring(false); }
  }

  const insight = interpretMHI(data?.alerts_active ?? 0, data?.total_cells ?? 0);

  return (
    <div className="animate-page-enter space-y-6 mb-12">
      <HeroBanner
        title="Marine Health Index"
        description={'How stressed is the ocean right now? A 0–100 health score for every monitored zone in the Indian EEZ, built from real ARGO float readings. <span style="opacity:.6">Isolation Forest anomaly detection · SST · Chl-a · DO · pH · Salinity</span>'}
      />

      <InsightCard severity={insight.severity} headline={insight.headline} body={insight.body} />

      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Grid Cells" value={data?.total_cells ?? 0} icon="ph ph-grid-four" />
            <MetricCard label="Alerts Active" value={data?.alerts_active ?? 0} icon="ph ph-warning" deltaColor="red" delta={`${data?.alerts_active ?? 0} cells stressed`} />
            <MetricCard label="Model" value="IsoForest" icon="ph ph-brain" />
            <MetricCard label="Data Source" value="ARGO" icon="ph ph-wave-sine" delta="Real float profiles" deltaColor="green" />
          </div>

          {isLoading ? <LoadingSpinner text="Computing MHI grid..." /> : (
            <div className="relative animate-data-enter">
              <MapContainer height="420px" points={mapPoints} />
              <MapLegend title="MHI Score" items={[
                { color: "#c25a44", label: "< 25 — Critical" },
                { color: "#d49a2e", label: "25–50 — Warning" },
                { color: "#d98b4a", label: "50–65 — Watch" },
                { color: "#3a8c5f", label: "> 65 — Normal" },
              ]} />
            </div>
          )}

          <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Stress Level Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogram}>
                <XAxis dataKey="name" tick={{ fill: "#6d7e80", fontSize: 12 }} />
                <YAxis tick={{ fill: "#8a9698", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {histogram.map((h) => <Cell key={h.name} fill={h.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stress breakdown cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Critical", icon: "ph-fill ph-warning", color: "#c25a44", bg: "#f6e6e1", count: histogram.find(h => h.name === "CRITICAL")?.count ?? 0 },
              { label: "Warning", icon: "ph ph-warning-circle", color: "#d49a2e", bg: "#f7efdb", count: histogram.find(h => h.name === "WARNING")?.count ?? 0 },
              { label: "Watch", icon: "ph ph-eye", color: "#d98b4a", bg: "#faf3e8", count: histogram.find(h => h.name === "WATCH")?.count ?? 0 },
              { label: "Normal", icon: "ph-fill ph-shield-check", color: "#3a8c5f", bg: "#eaf3ef", count: histogram.find(h => h.name === "NORMAL")?.count ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-card-border p-4 flex items-center gap-3" style={{ background: s.bg }}>
                <i className={s.icon} style={{ fontSize: 20, color: s.color }} />
                <div>
                  <div className="text-[20px] font-semibold" style={{ color: s.color, fontFamily: "'Newsreader', serif" }}>{s.count}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Data quality */}
          <div className="flex items-center justify-between bg-white border border-card-border rounded-xl px-5 py-3" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
            <div className="flex items-center gap-2 text-[12px] text-text-muted">
              <i className="ph ph-database text-accent" style={{ fontSize: 15 }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>ARGO GDAC · INCOIS · Climatology</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-text-muted">Coverage:</span>
              <span className="font-semibold text-[#3a8c5f]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Indian EEZ</span>
            </div>
          </div>
      </div>

      {/* Advanced Tools */}
      <div className="space-y-6">
        <AdvancedPanel title="Change region">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["lat_min", "lat_max", "lon_min", "lon_max"] as const).map((key) => (
              <label key={key} className="block">
                <span className="text-xs text-text-muted">{key.replace("_", " ").toUpperCase()}</span>
                <input type="number" value={bbox[key]} onChange={(e) => setBbox({ ...bbox, [key]: e.target.value })}
                  className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
              </label>
            ))}
          </div>
        </AdvancedPanel>

        <AdvancedPanel title="Model playground — score a custom location">
          <form onSubmit={handleScore} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(form).map(([key, val]) => (
            <label key={key} className="block">
              <span className="text-xs text-text-muted">{key.replace("_", " ")}</span>
              <input type="number" step="0.1" value={val}
                onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
            </label>
          ))}
          <button type="submit" disabled={scoring}
            className="col-span-2 md:col-span-5 bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
            {scoring ? "Computing..." : "Compute Score"}
          </button>
        </form>
        {score && (
          <div className="mt-4 flex items-center gap-4">
            <div className="text-3xl font-bold" style={{ color: mhiColor(score.mhi_score) }}>{score.mhi_score.toFixed(1)}</div>
            <div className="text-text-muted">/100</div>
            <ResultBadge label={score.stress_level} color={stressColor(score.stress_level)} size="lg" />
            {score.alert && <span className="text-[#c25a44] font-medium"><i className="ph ph-warning mr-1" />Alert</span>}
          </div>
        )}
        </AdvancedPanel>
      </div>
    </div>
  );
}
