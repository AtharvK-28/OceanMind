"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiPost } from "@/lib/api";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ResultBadge from "@/components/ui/ResultBadge";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import type { ScenarioPreset, ScenarioResponse } from "@/types/api";

const severityColors: Record<string, string> = { MILD: "#4caf50", MODERATE: "#fbc02d", SEVERE: "#ff9800", EXTREME: "#f44336" };

function deltaColor(v: number): string {
  if (v < -10) return "#d32f2f";
  if (v < -5) return "#f57c00";
  if (v < 0) return "#fbc02d";
  if (v < 5) return "#81c784";
  return "#388e3c";
}

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

  function applyPreset(id: string) {
    setPreset(id);
    const p = presets.find((x) => x.id === id);
    if (p) { setSstDelta(p.sst_delta_c); setDuration(p.duration_weeks); }
  }

  async function runScenario() {
    setRunning(true);
    try {
      const res = await apiPost<ScenarioResponse>("/api/v1/digital-twin/scenario", {
        sst_delta_c: sstDelta, duration_weeks: duration,
        include_mhi_projection: inclMhi, include_migration_shift: inclMig,
      });
      setResult(res);
    } finally { setRunning(false); }
  }

  const mhiPoints: MarkerPoint[] = (result?.mhi_projection?.data ?? []).map((p) => ({
    lat: p.lat, lng: p.lon, color: deltaColor(p.delta_mhi), radius: 7, fillOpacity: 0.7,
    tooltip: `ΔMHI: ${p.delta_mhi > 0 ? "+" : ""}${p.delta_mhi.toFixed(1)}`,
    popup: `<b>Baseline:</b> ${p.baseline_mhi.toFixed(1)}<br><b>Projected:</b> ${p.projected_mhi.toFixed(1)}<br><b>Alert:</b> ${p.alert_level}`,
  }));

  const migPoints: MarkerPoint[] = (result?.migration_shift?.data ?? []).map((p) => ({
    lat: p.lat, lng: p.lon,
    color: p.delta_prob > 0 ? "#4fc3f7" : p.delta_prob < -0.05 ? "#ef5350" : "#78909c",
    radius: 5, fillOpacity: 0.6,
    tooltip: `Δprob: ${p.delta_prob > 0 ? "+" : ""}${p.delta_prob.toFixed(3)}`,
  }));

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="🌐 Digital Twin — MHW Scenario Engine"
        description="<b>Phase G:</b> Parameterised SST perturbation → projected MHI score change + migration zone shift. Target: <b>&lt; 30s</b> compute."
        gradient="from-[#311b92] via-[#4527a0] to-[#512da8]"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Scenario</h3>

          <label className="block">
            <span className="text-xs text-white/50">Preset</span>
            <select value={preset} onChange={(e) => applyPreset(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
              <option value="custom">— Custom —</option>
              {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-white/50">SST Perturbation: <b className="text-white">{sstDelta > 0 ? "+" : ""}{sstDelta}°C</b></span>
            <input type="range" min={-5} max={10} step={0.5} value={sstDelta} onChange={(e) => setSstDelta(+e.target.value)}
              className="w-full accent-[#4fc3f7]" />
          </label>

          <label className="block">
            <span className="text-xs text-white/50">Duration: <b className="text-white">{duration} weeks</b></span>
            <input type="range" min={1} max={52} value={duration} onChange={(e) => setDuration(+e.target.value)}
              className="w-full accent-[#4fc3f7]" />
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={inclMhi} onChange={(e) => setInclMhi(e.target.checked)} className="accent-[#4fc3f7]" />
              Include MHI Projection
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={inclMig} onChange={(e) => setInclMig(e.target.checked)} className="accent-[#4fc3f7]" />
              Include Migration Shift
            </label>
          </div>

          <button onClick={runScenario} disabled={running}
            className="w-full bg-[#512da8] hover:bg-[#4527a0] text-white rounded-lg py-3 font-semibold transition-colors disabled:opacity-50">
            {running ? "Running..." : "🚀 Run Scenario"}
          </button>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {running && <LoadingSpinner text="Running scenario projection..." />}

          {result && !running && (
            <div className="animate-data-enter">
              <div className="flex items-center gap-4 mb-4">
                <ResultBadge label={result.scenario.severity} color={severityColors[result.scenario.severity] ?? "#9e9e9e"} size="lg" />
                <span className="text-white/70 text-sm">{result.scenario.name}</span>
              </div>

              {result.mhi_projection && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white/90">🌡️ Marine Health Index Projection</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="Grid Points" value={result.mhi_projection.grid_points} />
                    <MetricCard label="Avg ΔMHI" value={`${result.mhi_projection.avg_delta_mhi > 0 ? "+" : ""}${result.mhi_projection.avg_delta_mhi.toFixed(1)}`} />
                    <MetricCard label="Critical/Warning" value={result.mhi_projection.critical_cells} deltaColor="red" />
                  </div>
                  <p className="text-sm text-white/60">{result.mhi_projection.summary}</p>
                  <MapContainer height="380px" points={mhiPoints} />
                </div>
              )}

              {result.migration_shift && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white/90">🐟 Migration Zone Shift</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Poleward Shift" value={`${result.migration_shift.poleward_shift_deg > 0 ? "+" : ""}${result.migration_shift.poleward_shift_deg.toFixed(2)}°`} />
                    <MetricCard label="Grid Points" value={result.migration_shift.grid_points} />
                  </div>
                  <p className="text-sm text-white/60">{result.migration_shift.summary}</p>
                  <MapContainer height="380px" points={migPoints} />
                </div>
              )}

              {/* Species Impact Assessment */}
              {(result as any).species_impact && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white/90">🧬 Species Impact Assessment</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="Collapse Risk" value={(result as any).species_impact.collapse_risk_count} deltaColor="red" />
                    <MetricCard label="High Stress" value={(result as any).species_impact.high_stress_count} deltaColor="amber" />
                    <MetricCard label="Species Assessed" value={(result as any).species_impact.species.length} />
                  </div>
                  <p className="text-sm text-white/60">{(result as any).species_impact.summary}</p>

                  <div className="overflow-x-auto rounded-lg border border-white/8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-white/50 font-semibold">Species</th>
                          <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-white/50 font-semibold">Shift</th>
                          <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-white/50 font-semibold">Abundance</th>
                          <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-white/50 font-semibold">Status</th>
                          <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-white/50 font-semibold">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result as any).species_impact.species.map((sp: any) => {
                          const statusColors: Record<string, string> = {
                            COLLAPSE_RISK: "text-red-400", HIGH_STRESS: "text-orange-400",
                            MODERATE_STRESS: "text-yellow-400", STABLE: "text-green-400",
                          };
                          const statusColor = statusColors[sp.stress_status] ?? "text-white/50";
                          return (
                            <tr key={sp.aphia_id} className="border-t border-white/5">
                              <td className="px-4 py-2.5 text-white/80 font-medium">{sp.species}</td>
                              <td className="px-4 py-2.5 text-white/60">{sp.poleward_shift_deg > 0 ? "+" : ""}{sp.poleward_shift_deg}°</td>
                              <td className="px-4 py-2.5 text-white/60">{sp.abundance_change_pct > 0 ? "+" : ""}{sp.abundance_change_pct}%</td>
                              <td className={`px-4 py-2.5 font-semibold ${statusColor}`}>{sp.stress_status.replace("_", " ")}</td>
                              <td className="px-4 py-2.5 text-white/40 text-xs max-w-xs">{sp.note}</td>
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

          {!result && !running && (
            <div className="text-center py-20 text-white/40">
              Configure a scenario and click <b>Run Scenario</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
