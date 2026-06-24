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

export default function MHIPage() {
  const [bbox, setBbox] = useState({ lat_min: "5", lat_max: "25", lon_min: "60", lon_max: "100" });
  const params = Object.fromEntries(Object.entries(bbox));
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
    popup: `<b>MHI:</b> ${c.mhi_score.toFixed(1)}<br><b>Stress:</b> ${c.stress_level}<br><b>Alert:</b> ${c.alert ? "⚠️ YES" : "No"}`,
  }));

  const histogram = ["CRITICAL", "WARNING", "WATCH", "NORMAL"].map((level) => ({
    name: level,
    count: data?.grid_cells.filter((c) => c.stress_level === level).length ?? 0,
    fill: stressColor(level),
  }));

  async function handleScore(e: React.FormEvent) {
    e.preventDefault();
    setScoring(true);
    try {
      const res = await apiPost<MHIScoreResponse>("/api/v1/mhi/score", form);
      setScore(res);
    } finally { setScoring(false); }
  }

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="🌡️ Marine Health Index"
        description="<b>Isolation Forest</b> anomaly detection across SST, Chlorophyll-a, Dissolved Oxygen, pH, and Salinity. Score 0–100 (lower = more stressed)."
        gradient="from-[#1a237e] via-[#0d47a1] to-[#01579b]"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Bounding Box</h3>
          {(["lat_min", "lat_max", "lon_min", "lon_max"] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-xs text-white/50">{key.replace("_", " ").toUpperCase()}</span>
              <input type="number" value={bbox[key]} onChange={(e) => setBbox({ ...bbox, [key]: e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            </label>
          ))}
        </div>

        {/* Map + charts */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Grid Cells" value={data?.total_cells ?? 0} />
            <MetricCard label="Alerts Active" value={data?.alerts_active ?? 0} deltaColor="red" />
            <MetricCard label="Model" value="Isolation Forest" />
            <MetricCard label="Coverage" value="Indian EEZ" />
          </div>

          {isLoading ? <LoadingSpinner text="Computing MHI grid..." /> : (
            <div className="relative animate-data-enter">
              <MapContainer height="420px" points={mapPoints} />
              <MapLegend title="MHI Score" items={[
                { color: "#d32f2f", label: "< 25 — Critical" },
                { color: "#f57c00", label: "25–50 — Warning" },
                { color: "#fbc02d", label: "50–65 — Watch" },
                { color: "#388e3c", label: "> 65 — Normal" },
              ]} />
            </div>
          )}

          <div className="bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Stress Level Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogram}>
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {histogram.map((h) => <Cell key={h.name} fill={h.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Single-point scorer */}
      <div className="mt-8 bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Single-Point MHI Score</h3>
        <form onSubmit={handleScore} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(form).map(([key, val]) => (
            <label key={key} className="block">
              <span className="text-xs text-white/50">{key.replace("_", " ")}</span>
              <input type="number" step="0.1" value={val}
                onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            </label>
          ))}
          <button type="submit" disabled={scoring}
            className="col-span-2 md:col-span-5 bg-[#0288d1] hover:bg-[#0277bd] text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
            {scoring ? "Computing..." : "Compute Score"}
          </button>
        </form>
        {score && (
          <div className="mt-4 flex items-center gap-4">
            <div className="text-3xl font-bold" style={{ color: mhiColor(score.mhi_score) }}>{score.mhi_score.toFixed(1)}</div>
            <div className="text-white/60">/100</div>
            <ResultBadge label={score.stress_level} color={stressColor(score.stress_level)} size="lg" />
            {score.alert && <span className="text-red-400 font-medium">⚠️ Alert</span>}
          </div>
        )}
      </div>
    </div>
  );
}
