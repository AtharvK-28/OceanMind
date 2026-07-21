"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ResultBadge from "@/components/ui/ResultBadge";
import type { ScenarioPreset, ScenarioResponse, ScenarioPoint } from "@/types/api";
import { INDIAN_ZONES, type FishingZone } from "@/components/maps/DigitalTwinMap";
import type { MarkerPoint } from "@/components/maps/LeafletMap";

// Dynamic import — avoids SSR for Leaflet
const DigitalTwinMap = dynamic(() => import("@/components/maps/DigitalTwinMap"), { ssr: false });

// ── Colours ────────────────────────────────────────────────────────────────
const severityColors: Record<string, string> = {
  MILD: "#4caf50", MODERATE: "#fbc02d", SEVERE: "#ff9800", EXTREME: "#f44336",
};
const severityBg: Record<string, string> = {
  MILD: "#eaf3ef", MODERATE: "#fef9e7", SEVERE: "#fff3e0", EXTREME: "#fdecea",
};

function deltaColor(v: number): string {
  if (v < -10) return "#d32f2f";
  if (v < -5) return "#f57c00";
  if (v < 0) return "#fbc02d";
  if (v < 5) return "#81c784";
  return "#388e3c";
}

function alertColor(level: string): string {
  const m: Record<string, string> = { CRITICAL: "#c25a44", HIGH: "#d98b4a", MODERATE: "#d49a2e", LOW: "#3a8c5f", NONE: "#8a9698" };
  return m[level] ?? "#8a9698";
}

// ── Interpretation helper ──────────────────────────────────────────────────
function interpretSST(delta: number, weeks: number): { title: string; body: string; icon: string; color: string } {
  const abs = Math.abs(delta);
  if (delta >= 4)  return { title: "Extreme Warming Event", body: `A +${delta}°C anomaly over ${weeks} weeks mirrors a Category 3 Marine Heatwave. Coral bleaching risk is HIGH. Species poleward migration of 1–2° expected. Fishing grounds near the coast will likely shift northward.`, icon: "ph-fill ph-fire", color: "#d32f2f" };
  if (delta >= 2)  return { title: "Significant Warming", body: `+${delta}°C over ${weeks} weeks will stress thermally sensitive species (tuna, sardine spawning). Chlorophyll productivity may drop 15–25% in the top 50m. Recommend fishers move 30–80km offshore.`, icon: "ph ph-thermometer-hot", color: "#f57c00" };
  if (delta >= 0.5) return { title: "Moderate Warming", body: `+${delta}°C is within natural variability but if sustained for ${weeks} weeks will reduce Dissolved Oxygen by ~0.3 mg/L. MHI scores expected to dip 5–12 points in shallow coastal zones.`, icon: "ph ph-thermometer", color: "#fbc02d" };
  if (delta <= -2) return { title: "Cooling Event", body: `${delta}°C cooling (upwelling-like) will spike surface Chl-a by 20–40%. Sardine and anchovy recruitment improves. Excellent fishing conditions expected — green zones should expand.`, icon: "ph ph-snowflake", color: "#1f7a8c" };
  return { title: "Near-Baseline Scenario", body: `${delta}°C change over ${weeks} weeks is within seasonal tolerance. Minor MHI fluctuations (<5 pts) expected. A useful baseline reference run.`, icon: "ph ph-equals-circle", color: "#3a8c5f" };
}

// ── Advisory cards data ────────────────────────────────────────────────────
function buildAdvisories(delta: number, severity: string): Array<{ icon: string; title: string; body: string; color: string; bg: string }> {
  const advisories = [];

  if (delta > 0) {
    advisories.push({
      icon: "ph ph-anchor",
      title: "Fisher Advisory",
      body: delta >= 3 ? "Avoid coastal zones within 20nm. Move to depths > 60m where temperature gradients are more stable." : "Preferred fishing grounds may shift 20–50km. Monitor SFZ map weekly for zone updates.",
      color: "#d98b4a", bg: "#fdf5ec",
    });
    advisories.push({
      icon: "ph ph-leaf",
      title: "Ecosystem Impact",
      body: delta >= 3 ? "High coral bleaching risk in Gulf of Mannar and Andaman. eDNA diversity expected to drop 10–20% within 4 weeks." : "Phytoplankton bloom suppression likely. Zooplankton availability for juvenile fish reduced.",
      color: "#c25a44", bg: "#fdf2f0",
    });
  } else {
    advisories.push({
      icon: "ph ph-anchor",
      title: "Fisher Advisory",
      body: "Cooling conditions favour pelagic species aggregation near upwelling zones. Veraval and Mangalore banks likely optimal.",
      color: "#3a8c5f", bg: "#eaf3ef",
    });
    advisories.push({
      icon: "ph ph-leaf",
      title: "Ecosystem Benefit",
      body: "Cooler SST boosts DO and Chl-a. Sardine and mackerel spawning success expected to improve. Marine Health Index should rise 5–10 pts.",
      color: "#3a8c5f", bg: "#eaf3ef",
    });
  }

  if (severity === "EXTREME" || severity === "SEVERE") {
    advisories.push({
      icon: "ph-fill ph-warning",
      title: "Management Alert",
      body: "Recommend issuing fishing exclusion notices for RED-zone cells. Coordinate with INCOIS for daily satellite SST updates.",
      color: "#c25a44", bg: "#fdf2f0",
    });
  }

  advisories.push({
    icon: "ph ph-chart-line-up",
    title: "SFZ Implication",
    body: delta > 1 ? `~${Math.round(Math.abs(delta) * 8)}% of current GREEN zones expected to transition to AMBER within ${Math.ceil(delta * 1.5)} weeks.` : "Zone classifications largely stable. Reassess if anomaly persists beyond the projection window.",
    color: "#1f7a8c", bg: "#e8f4f7",
  });

  return advisories;
}

// ── Top-stressed zones table ───────────────────────────────────────────────
function topStressedZones(data: ScenarioPoint[], n = 6): ScenarioPoint[] {
  return [...data].sort((a, b) => a.delta_mhi - b.delta_mhi).slice(0, n);
}

// ══════════════════════════════════════════════════════════════════════════
export default function DigitalTwinPage() {
  const { data: presetsData } = useSWR<{ presets: ScenarioPreset[] }>("/api/v1/digital-twin/presets", fetcher);
  const presets = presetsData?.presets ?? [];

  const [preset, setPreset] = useState("custom");
  const [sstDelta, setSstDelta] = useState(2.0);
  const [duration, setDuration] = useState(3);
  const [inclMhi, setInclMhi] = useState(true);
  const [inclMig, setInclMig] = useState(true);
  const [result, setResult] = useState<ScenarioResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<FishingZone>(INDIAN_ZONES[0]);

  function applyPreset(id: string) {
    setPreset(id);
    const p = presets.find((x) => x.id === id);
    if (p) { setSstDelta(p.sst_delta_c); setDuration(p.duration_weeks); }
  }

  function selectZone(id: string) {
    const z = INDIAN_ZONES.find((z) => z.id === id) ?? INDIAN_ZONES[0];
    setActiveZone(z);
  }

  async function runScenario() {
    setRunning(true); setError(null);
    try {
      const res = await apiPost<ScenarioResponse>("/api/v1/digital-twin/scenario", {
        sst_delta_c: sstDelta, duration_weeks: duration,
        include_mhi_projection: inclMhi, include_migration_shift: inclMig,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect to backend. Make sure the API is running on port 8000.");
    } finally { setRunning(false); }
  }

  const mhiPoints: MarkerPoint[] = (result?.mhi_projection?.data ?? []).map((p) => ({
    lat: p.lat, lng: p.lon, color: deltaColor(p.delta_mhi), radius: 7, fillOpacity: 0.75,
    tooltip: `ΔMHI: ${p.delta_mhi > 0 ? "+" : ""}${p.delta_mhi.toFixed(1)} | ${p.alert_level}`,
    popup: `<b>Baseline MHI:</b> ${p.baseline_mhi.toFixed(1)}<br><b>Projected MHI:</b> ${p.projected_mhi.toFixed(1)}<br><b>Change:</b> ${p.delta_mhi > 0 ? "+" : ""}${p.delta_mhi.toFixed(1)}<br><b>Alert:</b> <span style="color:${alertColor(p.alert_level)}">${p.alert_level}</span>`,
  }));

  const migPoints: MarkerPoint[] = (result?.migration_shift?.data ?? []).map((p) => ({
    lat: p.lat, lng: p.lon,
    color: p.delta_prob > 0.02 ? "#1f7a8c" : p.delta_prob < -0.05 ? "#c25a44" : "#8a9698",
    radius: 5, fillOpacity: 0.6,
    tooltip: `Migration Δ: ${p.delta_prob > 0 ? "+" : ""}${(p.delta_prob * 100).toFixed(1)}%`,
    popup: `<b>Baseline prob:</b> ${(p.baseline_prob * 100).toFixed(1)}%<br><b>Projected prob:</b> ${(p.projected_prob * 100).toFixed(1)}%<br><b>Change:</b> ${p.delta_prob > 0 ? "+" : ""}${(p.delta_prob * 100).toFixed(1)}%`,
  }));

  const interp = interpretSST(sstDelta, duration);
  const advisories = result ? buildAdvisories(sstDelta, result.scenario.severity) : [];
  const stressed = result?.mhi_projection?.data ? topStressedZones(result.mhi_projection.data) : [];

  return (
    <div className="animate-page-enter space-y-6">
      <HeroBanner
        title="Digital Twin — MHW Scenario Engine"
        description="Parameterised SST perturbation → projected MHI score change + migration zone shift across the Indian EEZ. Select a zone, configure a scenario, and run the simulation."
      />

      {/* ── Top row: controls + map ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Scenario controls */}
        <div className="space-y-4">
          <div className="bg-white border border-card-border rounded-2xl p-4 space-y-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 8px 20px rgba(23,48,57,0.03)" }}>
            <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Scenario</div>

            {/* Preset */}
            <label className="block">
              <span className="text-xs text-text-muted">Preset scenario</span>
              <select value={preset} onChange={(e) => applyPreset(e.target.value)}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text">
                <option value="custom">— Custom —</option>
                {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>

            {/* SST slider */}
            <label className="block">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">SST Perturbation</span>
                <span className="text-xs font-bold" style={{ color: sstDelta > 0 ? "#d32f2f" : sstDelta < 0 ? "#1f7a8c" : "#6d7e80" }}>
                  {sstDelta > 0 ? "+" : ""}{sstDelta}°C
                </span>
              </div>
              <input type="range" min={-5} max={10} step={0.5} value={sstDelta}
                onChange={(e) => { setSstDelta(+e.target.value); setPreset("custom"); }}
                className="w-full mt-1 accent-accent" />
              <div className="flex justify-between text-[9px] text-text-faint mt-0.5">
                <span>−5°C</span><span>0</span><span>+10°C</span>
              </div>
            </label>

            {/* Duration slider */}
            <label className="block">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">Duration</span>
                <span className="text-xs font-bold text-text">{duration} {duration === 1 ? "week" : "weeks"}</span>
              </div>
              <input type="range" min={1} max={52} value={duration}
                onChange={(e) => { setDuration(+e.target.value); setPreset("custom"); }}
                className="w-full mt-1 accent-accent" />
              <div className="flex justify-between text-[9px] text-text-faint mt-0.5">
                <span>1 wk</span><span>26 wk</span><span>52 wk</span>
              </div>
            </label>

            {/* Toggles */}
            <div className="space-y-2 pt-1">
              {[
                { key: "mhi", label: "MHI Projection", val: inclMhi, set: setInclMhi },
                { key: "mig", label: "Migration Shift", val: inclMig, set: setInclMig },
              ].map(({ key, label, val, set }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                  <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="accent-[#1f7a8c]" />
                  {label}
                </label>
              ))}
            </div>

            <button onClick={runScenario} disabled={running}
              className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <i className="ph ph-play-circle" style={{ fontSize: 17 }} />
              {running ? "Running simulation…" : "Run Scenario"}
            </button>
          </div>

          {/* SST Interpretation card */}
          <div className="rounded-2xl border p-4 space-y-2" style={{ background: interp.color + "10", borderColor: interp.color + "40" }}>
            <div className="flex items-center gap-2">
              <i className={`${interp.icon} text-[18px]`} style={{ color: interp.color }} />
              <span className="text-[12px] font-semibold" style={{ color: interp.color }}>{interp.title}</span>
            </div>
            <p className="text-[11.5px] text-text-secondary leading-[1.55]">{interp.body}</p>
          </div>
        </div>

        {/* Map column */}
        <div className="lg:col-span-3 space-y-3">
          {/* Zone picker */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Focus zone:</span>
            <select
              value={activeZone.id}
              onChange={(e) => selectZone(e.target.value)}
              className="bg-white border border-card-border rounded-lg px-3 py-1.5 text-xs text-text font-medium shadow-sm"
            >
              {INDIAN_ZONES.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <span className="text-[10.5px] text-text-faint">{activeZone.description}</span>
          </div>

          {/* Zone quick-pills */}
          <div className="flex flex-wrap gap-1.5">
            {INDIAN_ZONES.slice(1).map((z) => (
              <button
                key={z.id}
                onClick={() => setActiveZone(z)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all"
                style={{
                  background: activeZone.id === z.id ? "#1f7a8c" : "white",
                  borderColor: activeZone.id === z.id ? "#1f7a8c" : "#ece5d6",
                  color: activeZone.id === z.id ? "white" : "#46585b",
                }}
              >
                {z.name.split(" (")[0]}
              </button>
            ))}
          </div>

          <DigitalTwinMap
            mhiPoints={mhiPoints}
            migPoints={migPoints}
            activeZone={activeZone}
            height="430px"
          />

          {!result && !running && !error && (
            <div className="rounded-xl border border-dashed border-[#d8cfbc] bg-[#faf7f1] px-5 py-5 text-center text-sm text-text-faint">
              <i className="ph ph-play-circle text-[28px] text-accent/50 mb-2 block" />
              Run a scenario to see projected changes on the map and get zone-level advisories.
            </div>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-[#f5c6c0] bg-[#fdf2f0] px-5 py-4 text-sm text-[#c25a44] flex items-start gap-3">
          <i className="ph ph-warning-circle text-[18px] mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {running && <LoadingSpinner text="Running scenario projection across Indian EEZ grid…" />}

      {/* ── Results ── */}
      {result && !running && (
        <div className="space-y-6 animate-data-enter">

          {/* Severity banner */}
          <div className="rounded-2xl border px-5 py-4 flex flex-wrap items-center gap-4"
            style={{ background: severityBg[result.scenario.severity] ?? "#f7f4ef", borderColor: (severityColors[result.scenario.severity] ?? "#d8cfbc") + "50" }}>
            <ResultBadge label={result.scenario.severity} color={severityColors[result.scenario.severity] ?? "#9e9e9e"} size="lg" />
            <div>
              <div className="text-[14px] font-semibold text-text">{result.scenario.name}</div>
              <div className="text-[12px] text-text-muted">
                SST {result.scenario.sst_delta_c > 0 ? "+" : ""}{result.scenario.sst_delta_c}°C · {result.scenario.duration_weeks} weeks · {result.mhi_projection?.grid_points ?? 0} grid cells · computed {new Date(result.computed_at).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Avg ΔMHI" value={`${(result.mhi_projection?.avg_delta_mhi ?? 0) > 0 ? "+" : ""}${(result.mhi_projection?.avg_delta_mhi ?? 0).toFixed(1)}`} icon="ph ph-heartbeat" deltaColor={result.mhi_projection?.avg_delta_mhi ?? 0 < 0 ? "red" : "green"} />
            <MetricCard label="Critical Cells" value={result.mhi_projection?.critical_cells ?? 0} icon="ph ph-warning" deltaColor="red" delta={`of ${result.mhi_projection?.grid_points ?? 0} total`} />
            <MetricCard label="Poleward Shift" value={`${(result.migration_shift?.poleward_shift_deg ?? 0) > 0 ? "+" : ""}${(result.migration_shift?.poleward_shift_deg ?? 0).toFixed(2)}°`} icon="ph ph-arrow-up-right" delta="Species migration" />
            <MetricCard label="Model" value={result.model} icon="ph ph-cpu" />
          </div>

          {/* MHI projection summary + top-stressed zones */}
          {result.mhi_projection && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-card-border rounded-2xl p-5 space-y-3" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.03)" }}>
                <h3 className="text-[13px] font-semibold text-text flex items-center gap-2">
                  <i className="ph ph-thermometer text-accent" />Marine Health Index Projection
                </h3>
                <p className="text-[12.5px] text-text-secondary leading-[1.55]">{result.mhi_projection.summary}</p>

                {/* ΔMHI distribution bar */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Alert level distribution</div>
                  {["CRITICAL", "HIGH", "MODERATE", "LOW", "NONE"].map((lvl) => {
                    const count = result.mhi_projection!.data.filter((d) => d.alert_level === lvl).length;
                    const pct = result.mhi_projection!.grid_points > 0 ? (count / result.mhi_projection!.grid_points) * 100 : 0;
                    if (count === 0) return null;
                    return (
                      <div key={lvl} className="flex items-center gap-2">
                        <div className="text-[10px] w-16 text-text-muted">{lvl}</div>
                        <div className="flex-1 h-[6px] rounded-full bg-[#eee7d8] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: alertColor(lvl) }} />
                        </div>
                        <div className="text-[10px] w-8 text-right text-text-muted">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top stressed grid cells */}
              <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.03)" }}>
                <h3 className="text-[13px] font-semibold text-text flex items-center gap-2 mb-3">
                  <i className="ph-fill ph-warning text-[#c25a44]" />Top stressed grid cells
                </h3>
                <div className="space-y-0 overflow-x-auto">
                  <table className="w-full text-[11.5px]">
                    <thead>
                      <tr>
                        {["Location", "Baseline", "Projected", "ΔMHI", "Alert"].map((h) => (
                          <th key={h} className="text-left pb-2 text-[9.5px] uppercase tracking-wider text-text-faint font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stressed.map((d, i) => (
                        <tr key={i} className="border-t border-[#f0ebdf]">
                          <td className="py-1.5 text-text-muted pr-2">{d.lat.toFixed(1)}°N, {d.lon.toFixed(1)}°E</td>
                          <td className="py-1.5 text-text pr-2">{d.baseline_mhi.toFixed(0)}</td>
                          <td className="py-1.5 text-text pr-2">{d.projected_mhi.toFixed(0)}</td>
                          <td className="py-1.5 font-semibold pr-2" style={{ color: deltaColor(d.delta_mhi) }}>
                            {d.delta_mhi > 0 ? "+" : ""}{d.delta_mhi.toFixed(1)}
                          </td>
                          <td className="py-1.5 font-medium text-[10px]" style={{ color: alertColor(d.alert_level) }}>{d.alert_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Migration shift */}
          {result.migration_shift && (
            <div className="bg-white border border-card-border rounded-2xl p-5 space-y-3" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <h3 className="text-[13px] font-semibold text-text flex items-center gap-2">
                <i className="ph ph-fish text-[#1f7a8c]" />Migration Zone Shift
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard label="Poleward Shift" value={`${result.migration_shift.poleward_shift_deg > 0 ? "+" : ""}${result.migration_shift.poleward_shift_deg.toFixed(2)}°`} icon="ph ph-arrow-up" delta="~111 km / degree" />
                <MetricCard label="Grid Points" value={result.migration_shift.grid_points} icon="ph ph-grid-four" />
                <MetricCard label="Shift in km" value={`~${Math.abs(result.migration_shift.poleward_shift_deg * 111).toFixed(0)} km`} icon="ph ph-map-pin" deltaColor={result.migration_shift.poleward_shift_deg > 0.5 ? "red" : "green"} />
              </div>
              <p className="text-[12.5px] text-text-secondary leading-[1.55]">{result.migration_shift.summary}</p>
            </div>
          )}

          {/* Advisory cards */}
          {advisories.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Actionable advisories</div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {advisories.map((a, i) => (
                  <div key={i} className="rounded-2xl border p-4 flex gap-3" style={{ background: a.bg, borderColor: a.color + "35" }}>
                    <span className="w-9 h-9 flex-none rounded-xl flex items-center justify-center mt-0.5" style={{ background: a.color + "18", color: a.color }}>
                      <i className={a.icon} style={{ fontSize: 18 }} />
                    </span>
                    <div>
                      <div className="text-[12.5px] font-semibold text-text mb-0.5">{a.title}</div>
                      <p className="text-[11.5px] text-text-secondary leading-[1.5]">{a.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Species impact table if available */}
          {(result as any).species_impact && (
            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <h3 className="text-[13px] font-semibold text-text flex items-center gap-2 mb-4">
                <i className="ph ph-dna text-[#8a5bb5]" />Species Impact Assessment
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MetricCard label="Collapse Risk" value={(result as any).species_impact.collapse_risk_count} deltaColor="red" />
                <MetricCard label="High Stress" value={(result as any).species_impact.high_stress_count} deltaColor="amber" />
                <MetricCard label="Assessed" value={(result as any).species_impact.species.length} />
              </div>
              <p className="text-[12.5px] text-text-secondary mb-4">{(result as any).species_impact.summary}</p>
              <div className="overflow-x-auto rounded-xl border border-card-border">
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="bg-card-hover">
                      {["Species", "Shift", "Abundance Δ", "Status", "Note"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[9.5px] uppercase tracking-wider text-text-muted font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(result as any).species_impact.species.map((sp: any) => {
                      const c: Record<string, string> = { COLLAPSE_RISK: "#c25a44", HIGH_STRESS: "#d49a2e", MODERATE_STRESS: "#d4a520", STABLE: "#3a8c5f" };
                      return (
                        <tr key={sp.aphia_id} className="border-t border-card-border">
                          <td className="px-4 py-2.5 font-medium text-text">{sp.species}</td>
                          <td className="px-4 py-2.5 text-text-muted">{sp.poleward_shift_deg > 0 ? "+" : ""}{sp.poleward_shift_deg}°</td>
                          <td className="px-4 py-2.5 text-text-muted">{sp.abundance_change_pct > 0 ? "+" : ""}{sp.abundance_change_pct}%</td>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: c[sp.stress_status] ?? "#8a9698" }}>{sp.stress_status.replace(/_/g, " ")}</td>
                          <td className="px-4 py-2.5 text-text-faint max-w-[200px]">{sp.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
