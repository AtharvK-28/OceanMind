"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetcher, apiPost } from "@/lib/api";
import { mhiColor, stressColor } from "@/lib/colors";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorState from "@/components/ui/ErrorState";
import ResultBadge from "@/components/ui/ResultBadge";
import ScoreGuide from "@/components/ui/ScoreGuide";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import type { MHIStatusResponse, MHIScoreResponse } from "@/types/api";

export default function MHIPage() {
  const [bbox, setBbox] = useState({ lat_min: "5", lat_max: "25", lon_min: "60", lon_max: "100" });
  // Debounce so typing a multi-digit value (e.g. "25") doesn't fire a heavy grid
  // request for each intermediate keystroke.
  const [applied, setApplied] = useState(bbox);
  useEffect(() => {
    const id = setTimeout(() => setApplied(bbox), 500);
    return () => clearTimeout(id);
  }, [bbox]);
  const nums = { lat_min: +applied.lat_min, lat_max: +applied.lat_max, lon_min: +applied.lon_min, lon_max: +applied.lon_max };
  const bboxValid = Object.values(nums).every(Number.isFinite) && nums.lat_min < nums.lat_max && nums.lon_min < nums.lon_max;
  const { data, isLoading, error, mutate } = useSWR<MHIStatusResponse>(
    bboxValid
      ? `/api/v1/mhi/status?lat_min=${applied.lat_min}&lat_max=${applied.lat_max}&lon_min=${applied.lon_min}&lon_max=${applied.lon_max}`
      : null,
    fetcher
  );

  const [form, setForm] = useState({ sst_c: 28.5, chlorophyll_mgl: 0.3, dissolved_o2: 200, ph: 8.1, salinity_psu: 34.5 });

  const FIELD_LABELS: Record<string, string> = {
    sst_c: "SST (°C)", chlorophyll_mgl: "Chlorophyll-a (mg/L)",
    dissolved_o2: "Dissolved O₂ (µmol/kg)", ph: "pH", salinity_psu: "Salinity (PSU)",
  };
  const [score, setScore] = useState<MHIScoreResponse | null>(null);
  const [scoring, setScoring] = useState(false);

  // Honest data-source label straight from the API, instead of asserting "real".
  const dataSource = data?.data_source ?? "";
  const isRealArgo = dataSource.toLowerCase().includes("real");
  const sourceShort = isRealArgo ? "ARGO GDAC" : "Climatology";
  const sourceNote = isRealArgo ? "Real float profiles" : "Climatology-calibrated";

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

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Marine Health Index"
        description={`<b>Isolation Forest</b> anomaly detection across SST, Chlorophyll-a, Dissolved Oxygen, pH, and Salinity. Score 0–100 (lower = more stressed). Data source: <b>${dataSource || "loading…"}</b>.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Bounding Box</h3>
          {(["lat_min", "lat_max", "lon_min", "lon_max"] as const).map((key) => (
            <label key={key} className="block">
              <span className="text-xs text-text-muted">{key.replace("_", " ").toUpperCase()}</span>
              <input type="number" value={bbox[key]} onChange={(e) => setBbox({ ...bbox, [key]: e.target.value })}
                className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
            </label>
          ))}
          {!bboxValid && (
            <p className="text-[12px] text-[#c25a44] flex items-start gap-1.5">
              <i className="ph ph-warning-circle mt-0.5" style={{ fontSize: 13 }} />
              Enter a valid box — each MIN must be below its MAX.
            </p>
          )}
        </div>

        {/* Map + charts */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Grid Cells" value={data?.total_cells ?? 0} icon="ph ph-grid-four" />
            <MetricCard label="Alerts Active" value={data?.alerts_active ?? 0} icon="ph ph-warning" deltaColor="red" delta={`${data?.alerts_active ?? 0} cells stressed`} />
            <MetricCard label="Model" value="IsoForest" icon="ph ph-brain" />
            <MetricCard label="Data Source" value={sourceShort} icon="ph ph-wave-sine" delta={sourceNote} deltaColor={isRealArgo ? "green" : "amber"} />
          </div>

          {!bboxValid ? (
            <div className="rounded-2xl border border-card-border bg-white px-5 py-10 text-center text-sm text-text-muted flex flex-col items-center gap-2">
              <i className="ph ph-selection-all text-[28px] text-text-faint" />
              Adjust the bounding box on the left to load the grid.
            </div>
          ) : error ? <ErrorState message="Couldn't load the marine health grid" onRetry={() => mutate()} /> : isLoading ? <LoadingSpinner text="Computing MHI grid..." /> : (
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
                <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
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
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{dataSource || "ARGO GDAC · INCOIS · Climatology"}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-text-muted">Coverage:</span>
              <span className="font-semibold text-[#3a8c5f]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Indian EEZ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Single-point scorer */}
      <div className="mt-8 bg-white border border-card-border rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Single-Point MHI Score</h3>
        <form onSubmit={handleScore} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(form).map(([key, val]) => (
            <label key={key} className="block">
              <span className="text-xs text-text-muted">{FIELD_LABELS[key] ?? key.replace(/_/g, " ")}</span>
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
      </div>

      <ScoreGuide
        title="What does the Marine Health Index mean?"
        intro="MHI is a 0–100 measure of how normal the water column looks at a grid cell. An Isolation Forest is trained on healthy ocean conditions, then scores each new observation by how far it deviates from that baseline — so a low score means 'this water is behaving unusually', not simply 'this water is warm'."
        bands={[
          { range: "65–100", label: "Normal", color: "#3a8c5f", meaning: "Conditions sit inside the healthy envelope for this region and season.", action: "Fish normally. Nothing here needs attention." },
          { range: "50–64", label: "Watch", color: "#8bbf5f", meaning: "Mild deviation — often the leading edge of a seasonal shift or a developing anomaly.", action: "Note it. Re-check next week before changing plans." },
          { range: "25–49", label: "Warning", color: "#d49a2e", meaning: "Clear multi-parameter stress. This is where an alert is raised.", action: "Expect species to move. Cross-check the fishing zones map before heading out." },
          { range: "0–24", label: "Critical", color: "#c25a44", meaning: "Severe anomaly — the combination of heat, oxygen and pH is well outside normal.", action: "Treat as a possible heatwave or hypoxic event. Escalate to managers." },
        ]}
        factors={[
          { name: "SST anomaly", detail: "Deviation from the rolling temperature mean — not absolute temperature, so 29 °C is normal in May and alarming in January." },
          { name: "Chlorophyll deviation", detail: "Departure from the productivity baseline. Collapse here precedes a drop in forage fish." },
          { name: "Dissolved oxygen", detail: "µmol/kg. Low DO drives fish out of a cell faster than warmth alone." },
          { name: "pH", detail: "Acidification stress, particularly on shell-forming species and larvae." },
          { name: "Salinity", detail: "PSU. Freshwater intrusion and evaporation both shift the habitat envelope." },
          { name: "DO × pH compound", detail: "An interaction term — low oxygen and low pH together are far worse than either alone." },
        ]}
        method="Model: Isolation Forest (unsupervised anomaly detection, 8% contamination). Because it is unsupervised, it flags unusual conditions rather than predicting a named event — a critical score is a prompt to investigate, not a diagnosis. Inputs are ARGO float profiles with INCOIS SST where available."
      />
    </div>
  );
}
