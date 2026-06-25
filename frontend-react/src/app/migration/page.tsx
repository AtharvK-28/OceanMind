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
        title="Fish Migration Forecast"
        description="<b>ConvLSTM (CATCH architecture)</b> — Spatiotemporal probability heatmap with <b>Monte Carlo Dropout</b> confidence intervals (N=50 passes)."
      />

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <label className="text-sm text-text-muted">Weeks ahead:</label>
          <span className="text-2xl font-bold text-accent animate-number min-w-[2ch] text-center">{weeks}</span>
          <span className="text-xs text-text-faint">/ 8</span>
        </div>
        <input type="range" min={1} max={8} value={weeks} onChange={(e) => setWeeks(+e.target.value)}
          className="w-full max-w-md" />
        <div className="flex justify-between max-w-md text-[0.65rem] text-text-faint mt-1 px-0.5">
          {[1,2,3,4,5,6,7,8].map(w => <span key={w} className={w === weeks ? "text-accent font-bold" : ""}>{w}w</span>)}
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
        <div className="mt-6 bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Prediction Uncertainty (Top 25 cells)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <XAxis dataKey="lon" name="Longitude" tick={{ fill: "#8a9698", fontSize: 11 }} />
              <YAxis dataKey="prob" name="Probability" domain={[0, 1]} tick={{ fill: "#8a9698", fontSize: 11 }} />
              <Tooltip />
              <Scatter data={top25} fill="#1f7a8c">
                <ErrorBar dataKey="errorUp" direction="y" stroke="rgba(31,122,140,0.4)" />
                <ErrorBar dataKey="errorDown" direction="y" stroke="rgba(31,122,140,0.4)" />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
