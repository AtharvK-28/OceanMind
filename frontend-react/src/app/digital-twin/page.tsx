"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher, apiPost } from "@/lib/api";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ResultBadge from "@/components/ui/ResultBadge";
import ScoreGuide from "@/components/ui/ScoreGuide";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, CartesianGrid,
} from "recharts";
import type { ScenarioPreset } from "@/types/api";
import type { TwinCell } from "@/components/maps/TwinGlobe";

const TwinGlobe = dynamic(() => import("@/components/maps/TwinGlobe"), { ssr: false });

const severityColors: Record<string, string> = { MILD: "#4caf50", MODERATE: "#fbc02d", SEVERE: "#ff9800", EXTREME: "#f44336" };

function deltaColor(v: number): string {
  if (v < -10) return "#d32f2f";
  if (v < -5) return "#f57c00";
  if (v < 0) return "#fbc02d";
  if (v < 5) return "#81c784";
  return "#388e3c";
}

interface TimelineFrame { week: number; avg_mhi: number; critical_cells: number; poleward_shift_deg: number; }
interface SpeciesImpact {
  aphia_id: number; species: string; poleward_shift_deg: number;
  abundance_change_pct: number; stress_status: string; collapse_threshold_c: number; note: string;
}
interface SimResponse {
  scenario: { name: string; sst_delta_c: number; duration_weeks: number; severity: string };
  grid_cells: number;
  cells: TwinCell[];
  timeline: TimelineFrame[];
  baseline_mhi: number;
  final_mhi: number;
  species_impact: SpeciesImpact[];
  method_note: string;
}

export default function DigitalTwinPage() {
  const { data: presetsData } = useSWR<{ presets: ScenarioPreset[] }>("/api/v1/digital-twin/presets", fetcher);
  const presets = presetsData?.presets ?? [];

  const [preset, setPreset] = useState("custom");
  const [sstDelta, setSstDelta] = useState(2.5);
  const [duration, setDuration] = useState(8);
  const [rotating, setRotating] = useState(false);
  const [sim, setSim] = useState<SimResponse | null>(null);
  const [running, setRunning] = useState(false);

  const [frame, setFrame] = useState(0);       // index into timeline
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function applyPreset(id: string) {
    setPreset(id);
    const p = presets.find((x) => x.id === id);
    if (p) { setSstDelta(p.sst_delta_c); setDuration(p.duration_weeks); }
  }

  const runSim = useCallback(async () => {
    setRunning(true);
    setPlaying(false);
    try {
      const res = await apiPost<SimResponse>("/api/v1/digital-twin/simulate", {
        sst_delta_c: sstDelta, duration_weeks: duration,
      });
      setSim(res);
      setFrame(0);
      setPlaying(true); // auto-play the heatwave building
    } finally { setRunning(false); }
  }, [sstDelta, duration]);

  const mounted = useRef(false);
  useEffect(() => { if (!mounted.current) { mounted.current = true; runSim(); } }, [runSim]);

  // Animation loop: advance frames while playing
  useEffect(() => {
    if (!playing || !sim) return;
    timer.current = setInterval(() => {
      setFrame((f) => {
        if (f >= sim.timeline.length - 1) { setPlaying(false); return f; }
        return f + 1;
      });
    }, 700);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, sim]);

  const tl = sim?.timeline ?? [];
  const cur = tl[frame];
  const weeks = tl.length ? tl[tl.length - 1].week : 0;
  const curDelta = sim && cur ? cur.avg_mhi - sim.baseline_mhi : 0;

  function togglePlay() {
    if (!sim) return;
    if (frame >= tl.length - 1) { setFrame(0); setPlaying(true); }
    else setPlaying((p) => !p);
  }

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="What-If Ocean Explorer"
        description="Ask <b>&ldquo;what if the sea warms by +2.5&deg;C?&rdquo;</b> &mdash; then <b>watch the marine heatwave unfold</b> week by week across the Indian EEZ, and see how ocean health, fish migration, and species stress respond."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* ── Controls ───────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Scenario</h3>

          <label className="block">
            <span className="text-xs text-text-muted">Preset</span>
            <select value={preset} onChange={(e) => applyPreset(e.target.value)}
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text">
              <option value="custom">— Custom —</option>
              {presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-text-muted">SST anomaly: <b className="text-text">{sstDelta > 0 ? "+" : ""}{sstDelta}°C</b></span>
            <input type="range" min={-5} max={10} step={0.5} value={sstDelta} onChange={(e) => { setSstDelta(+e.target.value); setPreset("custom"); }}
              className="w-full accent-accent" />
          </label>

          <label className="block">
            <span className="text-xs text-text-muted">Duration: <b className="text-text">{duration} weeks</b></span>
            <input type="range" min={1} max={52} value={duration} onChange={(e) => { setDuration(+e.target.value); setPreset("custom"); }}
              className="w-full accent-accent" />
          </label>

          <button onClick={runSim} disabled={running}
            className="w-full bg-accent hover:bg-accent-dark text-white rounded-lg py-3 font-semibold transition-colors disabled:opacity-50">
            {running ? "Simulating..." : "Run Simulation"}
          </button>

          <label className="flex items-center gap-2 text-sm text-text-muted pt-1">
            <input type="checkbox" checked={rotating} onChange={(e) => setRotating(e.target.checked)} className="accent-[#1f7a8c]" />
            Auto-rotate globe
          </label>

          {sim && cur && (
            <div className="rounded-xl border border-card-border bg-card-hover p-4 space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <ResultBadge label={sim.scenario.severity} color={severityColors[sim.scenario.severity] ?? "#9e9e9e"} size="sm" />
                <span className="text-xs text-text-muted">{sim.scenario.name}</span>
              </div>
              <div>
                <div className="text-[0.65rem] uppercase tracking-wider text-text-muted">Ocean health @ week {cur.week}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: deltaColor(curDelta) }}>{cur.avg_mhi.toFixed(1)}</span>
                  <span className="text-sm font-semibold" style={{ color: deltaColor(curDelta) }}>
                    ({curDelta > 0 ? "+" : ""}{curDelta.toFixed(1)})
                  </span>
                </div>
                <div className="text-[0.7rem] text-text-faint">baseline {sim.baseline_mhi.toFixed(1)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-white/60 border border-card-border py-2">
                  <div className="text-lg font-bold text-[#c25a44]">{cur.critical_cells}</div>
                  <div className="text-[0.6rem] uppercase text-text-muted">cells critical</div>
                </div>
                <div className="rounded-lg bg-white/60 border border-card-border py-2">
                  <div className="text-lg font-bold text-text">{cur.poleward_shift_deg > 0 ? "+" : ""}{cur.poleward_shift_deg.toFixed(2)}°</div>
                  <div className="text-[0.6rem] uppercase text-text-muted">poleward shift</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Globe + timeline + chart ───────────── */}
        <div className="space-y-5 min-w-0">
          {running && !sim && <LoadingSpinner text="Building ocean simulation..." />}

          {sim && (
            <>
              <div className="relative">
                <TwinGlobe cells={sim.cells} week={cur?.week ?? 0} rotating={rotating} height={480} />
                <div className="absolute top-3 left-3 rounded-lg bg-black/45 backdrop-blur px-3 py-2 text-white pointer-events-none">
                  <div className="text-[0.6rem] uppercase tracking-wider text-white/60">Week</div>
                  <div className="text-2xl font-bold leading-none">{cur?.week ?? 0}<span className="text-sm text-white/50"> / {weeks}</span></div>
                </div>
                <div className="absolute top-3 right-3 rounded-lg bg-black/45 backdrop-blur px-3 py-2 text-white pointer-events-none">
                  <div className="flex items-center gap-3 text-[0.65rem]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgb(46,125,91)" }} />Healthy</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgb(212,154,46)" }} />Stressed</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgb(175,52,42)" }} />Critical</span>
                  </div>
                  <div className="text-[0.55rem] text-white/50 mt-1">height = thermal stress</div>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-3">
                <button onClick={togglePlay}
                  className="flex-none w-11 h-11 rounded-full bg-accent hover:bg-accent-dark text-white flex items-center justify-center transition-colors">
                  <i className={`ph-fill ${playing ? "ph-pause" : "ph-play"} text-lg`} />
                </button>
                <input type="range" min={0} max={Math.max(0, tl.length - 1)} value={frame}
                  onChange={(e) => { setPlaying(false); setFrame(+e.target.value); }}
                  className="flex-1 accent-accent" />
                <span className="flex-none text-xs text-text-muted tabular-nums w-20 text-right">week {cur?.week ?? 0} / {weeks}</span>
              </div>

              {/* Trajectory chart */}
              <div className="bg-white border border-card-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-text mb-1"><i className="ph ph-chart-line-down mr-2" />Ocean-health trajectory</h3>
                <p className="text-xs text-text-muted mb-3">Fleet-average Marine Health Index as the {sstDelta > 0 ? "heatwave" : "cold event"} develops over {weeks} weeks.</p>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={tl} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mhiFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1f7a8c" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#1f7a8c" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ece5d7" vertical={false} />
                    {/* critical zone */}
                    <ReferenceArea y1={0} y2={50} fill="#c25a44" fillOpacity={0.06} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#7d8a8c" }} label={{ value: "week", position: "insideBottomRight", offset: -2, fontSize: 10, fill: "#9aa" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#7d8a8c" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e0d8ca" }}
                      formatter={(v) => [`${Number(v).toFixed(1)} MHI`, "Ocean health"]} labelFormatter={(l) => `Week ${l}`} />
                    <ReferenceLine y={sim.baseline_mhi} stroke="#9aa7a9" strokeDasharray="4 4" label={{ value: "baseline", fontSize: 10, fill: "#9aa7a9", position: "insideTopLeft" }} />
                    <ReferenceLine y={50} stroke="#d8a99c" strokeDasharray="2 4" label={{ value: "critical", fontSize: 9.5, fill: "#c08575", position: "insideBottomLeft" }} />
                    {cur && <ReferenceLine x={cur.week} stroke="#1f7a8c" strokeWidth={2} strokeOpacity={0.55} />}
                    <Area type="monotone" dataKey="avg_mhi" stroke="#1f7a8c" strokeWidth={2.5} fill="url(#mhiFill)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* End-state summary metrics */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCard label="Cells modelled" value={sim.grid_cells} />
                <MetricCard label={`MHI @ week ${weeks}`} value={sim.final_mhi.toFixed(1)} />
                <MetricCard label="Net change" value={`${sim.final_mhi - sim.baseline_mhi > 0 ? "+" : ""}${(sim.final_mhi - sim.baseline_mhi).toFixed(1)}`} />
              </div>

              {/* Species impact */}
              {sim.species_impact?.length > 0 && (
                <div className="bg-white border border-card-border rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-text mb-3"><i className="ph ph-dna mr-2" />Species impact @ week {weeks}</h3>
                  <div className="overflow-x-auto rounded-lg border border-card-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-card-hover">
                          {["Species", "Shift", "Abundance", "Status", "Note"].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-text-muted font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sim.species_impact.map((sp) => {
                          const statusColors: Record<string, string> = {
                            COLLAPSE_RISK: "text-[#c25a44]", HIGH_STRESS: "text-[#d49a2e]",
                            MODERATE_STRESS: "text-[#d4a520]", STABLE: "text-[#3a8c5f]",
                          };
                          return (
                            <tr key={sp.aphia_id} className="border-t border-card-border">
                              <td className="px-4 py-2.5 text-text font-medium">{sp.species}</td>
                              <td className="px-4 py-2.5 text-text-muted">{sp.poleward_shift_deg > 0 ? "+" : ""}{sp.poleward_shift_deg}°</td>
                              <td className="px-4 py-2.5 text-text-muted">{sp.abundance_change_pct > 0 ? "+" : ""}{sp.abundance_change_pct}%</td>
                              <td className={`px-4 py-2.5 font-semibold ${statusColors[sp.stress_status] ?? "text-text-muted"}`}>{sp.stress_status.replace("_", " ")}</td>
                              <td className="px-4 py-2.5 text-text-faint text-xs max-w-xs">{sp.note}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ScoreGuide
        title="What do the simulation's numbers mean?"
        intro="The twin projects a temperature scenario forward week by week and reports what it does to ecosystem health and to individual species. Three numbers matter: the projected Marine Health Index (colour on the globe), the poleward shift in degrees of latitude, and the abundance change per species."
        bandsHeading="Severity of the scenario you ran"
        bands={[
          { range: "under +0.5 °C", label: "Near baseline", color: "#3a8c5f", meaning: "Within ordinary seasonal variability. MHI moves by only a few points.", action: "Useful as the control run to compare other scenarios against." },
          { range: "+0.5 to +2 °C", label: "Moderate", color: "#d4a520", meaning: "Sustained warming starts pulling dissolved oxygen down and suppressing productivity.", action: "Watch thermally sensitive species — sardine and tuna spawning suffer first." },
          { range: "+2 to +4 °C", label: "Severe", color: "#ff9800", meaning: "Comparable to a real marine heatwave. Grounds move measurably and MHI drops sharply.", action: "Plan for fishers travelling further offshore and for zone re-classification." },
          { range: "+4 °C and above", label: "Extreme", color: "#c25a44", meaning: "Category-3 heatwave territory — bleaching risk, collapse thresholds crossed for some species.", action: "Management scenario: exclusion notices, daily SST monitoring, alternative livelihoods." },
        ]}
        factorsHeading="Reading the outputs"
        factors={[
          { name: "Projected MHI", detail: "Same 0–100 scale as the Marine Health Index page. Below 50 is elevated stress; below 25 is critical." },
          { name: "Poleward shift (°)", detail: "How far north a species' viable habitat moves. Roughly 0.4° of latitude per °C of warming — about 44 km per degree." },
          { name: "Abundance change (%)", detail: "Projected change in local abundance. Negative means the species thins out in these waters, not that it dies globally." },
          { name: "Stress status", detail: "STABLE → MODERATE → HIGH_STRESS → COLLAPSE_RISK, set by how close the projected temperature comes to that species' published collapse threshold." },
          { name: "Critical cells", detail: "Grid cells whose projected MHI falls into the critical band in that week — the count to watch as the timeline plays." },
          { name: "Spike height on the globe", detail: "Thermal stress magnitude per cell. Colour is health, height is heat." },
        ]}
      />

      <p className="mt-6 text-[0.7rem] leading-relaxed text-text-faint border-t border-card-border pt-4">
        <b className="text-text-muted">How this works:</b>{" "}an indicative projection built on regional ocean
        climatology and published thermal-response rates (poleward shift ~0.4&deg; lat/&deg;C, Cheung et&nbsp;al. 2013;
        DO&ndash;temperature synergy, Breitburg et&nbsp;al. 2018; species collapse thresholds from CMFRI records).
        The globe shows projected Marine Health Index (colour) and thermal stress (spike height) evolving week by week.
        It is a decision-support &ldquo;what-if,&rdquo; <b>not a certified forecast</b>. A full mechanistic ocean
        twin (Lagrangian particle tracking, larval connectivity) is on the roadmap.
      </p>
    </div>
  );
}
