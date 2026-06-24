"use client";
import { useState } from "react";
import useSWR from "swr";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ErrorBar } from "recharts";
import { fetcher } from "@/lib/api";
import { migrationColor } from "@/lib/colors";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner, { DataTransition } from "@/components/ui/LoadingSpinner";
import { SkeletonRow, SkeletonMap } from "@/components/ui/Skeleton";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import type { MigrationForecastResponse } from "@/types/api";

export default function MigrationPage() {
  const [weeks, setWeeks] = useState(1);
  const { data, isLoading } = useSWR<MigrationForecastResponse>(`/api/v1/migration/forecast?weeks_ahead=${weeks}`, fetcher);

  const features = data?.features ?? [];
  const probs = features.map((f) => f.properties.migration_probability);
  const peak = probs.length ? Math.max(...probs) : 0;
  const mean = probs.length ? probs.reduce((a, b) => a + b, 0) / probs.length : 0;
  const meanCI = features.length
    ? features.reduce((a, f) => a + f.properties.uncertainty, 0) / features.length : 0;

  const mapPoints: MarkerPoint[] = features.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties.migration_probability;
    return {
      lat, lng,
      color: migrationColor(p),
      fillOpacity: 0.3 + p * 0.6,
      radius: 5,
      tooltip: `P: ${p.toFixed(3)} [${f.properties.ci_lower.toFixed(3)}, ${f.properties.ci_upper.toFixed(3)}]`,
    };
  });

  const top25 = [...features]
    .sort((a, b) => b.properties.migration_probability - a.properties.migration_probability)
    .slice(0, 25)
    .map((f) => ({
      lon: f.geometry.coordinates[0],
      prob: f.properties.migration_probability,
      errorUp: f.properties.ci_upper - f.properties.migration_probability,
      errorDown: f.properties.migration_probability - f.properties.ci_lower,
    }));

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="🐟 Fish Migration Forecast"
        description="<b>ConvLSTM (CATCH architecture)</b> — Spatiotemporal probability heatmap with <b>Monte Carlo Dropout</b> confidence intervals (N=50 passes)."
        gradient="from-[#004d40] via-[#00695c] to-[#00796b]"
      />

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <label className="text-sm text-white/70">Weeks ahead:</label>
          <span className="text-2xl font-bold text-[#4fc3f7] animate-number min-w-[2ch] text-center">{weeks}</span>
          <span className="text-xs text-white/40">/ 8</span>
        </div>
        <input type="range" min={1} max={8} value={weeks} onChange={(e) => setWeeks(+e.target.value)}
          className="w-full max-w-md" />
        <div className="flex justify-between max-w-md text-[0.65rem] text-white/30 mt-1 px-0.5">
          {[1,2,3,4,5,6,7,8].map(w => <span key={w} className={w === weeks ? "text-[#4fc3f7] font-bold" : ""}>{w}w</span>)}
        </div>
      </div>

      <DataTransition loading={isLoading}>
        <div className="grid grid-cols-3 gap-4 mb-6 animate-stagger">
          <MetricCard label="Peak Probability" value={peak.toFixed(3)} />
          <MetricCard label="Mean Probability" value={mean.toFixed(3)} />
          <MetricCard label="Mean CI Width" value={`±${meanCI.toFixed(3)}`} />
        </div>
      </DataTransition>

      {isLoading ? <SkeletonMap /> : (
        <div className="animate-data-enter relative">
          <MapContainer height="480px" points={mapPoints} />
          <MapLegend title="Migration P" items={[
            { color: "#440154", label: "< 0.2 — Very Low" },
            { color: "#3b528b", label: "0.2–0.4 — Low" },
            { color: "#21918c", label: "0.4–0.6 — Moderate" },
            { color: "#5ec962", label: "0.6–0.8 — High" },
            { color: "#fde725", label: "> 0.8 — Very High" },
          ]} />
        </div>
      )}

      {top25.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            Prediction Uncertainty (Top 25 cells)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <XAxis dataKey="lon" name="Longitude" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
              <YAxis dataKey="prob" name="Probability" domain={[0, 1]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
              <Tooltip />
              <Scatter data={top25} fill="#4fc3f7">
                <ErrorBar dataKey="errorUp" direction="y" stroke="rgba(100,200,255,0.4)" />
                <ErrorBar dataKey="errorDown" direction="y" stroke="rgba(100,200,255,0.4)" />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
