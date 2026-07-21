"use client";
import { useState } from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetcher, apiPost } from "@/lib/api";
import { sfzFoliumColor, sfzColor } from "@/lib/colors";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ResultBadge from "@/components/ui/ResultBadge";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import type { SFZCurrentResponse, SFZClassifyResponse, SHAPEntry } from "@/types/api";
import InsightCard from "@/components/ui/InsightCard";
import AdvancedPanel from "@/components/ui/AdvancedPanel";

function interpretSFZ(green: number, amber: number, red: number, total: number): { severity: "good"|"watch"|"warning"|"critical"; headline: string; body: string } {
  const greenPct = total ? Math.round((green / total) * 100) : 0;
  if (greenPct >= 60) return {
    severity: "good",
    headline: `${greenPct}% of monitored zones are green this week — good conditions across most of the coast.`,
    body: "Sardine and mackerel grounds are holding up well. Tap the map for the closest recommended zone to your port.",
  };
  if (greenPct >= 35) return {
    severity: "watch",
    headline: `${greenPct}% of zones are green — a mixed week, worth checking your specific stretch of coast.`,
    body: `${amber} zones are caution-rated and ${red} are flagged to avoid — mostly driven by bycatch risk or shifting sea surface temperature.`,
  };
  return {
    severity: "warning",
    headline: `Only ${greenPct}% of zones are green this week — conditions are tighter than usual.`,
    body: `${red} zones are currently flagged red. Consider the Digital Twin tool to see whether this is a short-term dip or a longer trend.`,
  };
}

export default function SFZPage() {
  const { data, isLoading } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", fetcher);
  const summary = data?.zone_summary ?? {};

  const [form, setForm] = useState({ latitude: 12, longitude: 74, sst_c: 28.5, chlorophyll_mgl: 0.3, ssh_anomaly: 0, mld_m: 50, fishing_effort_h: 2, wind_stress_curl: 0 });
  const [result, setResult] = useState<SFZClassifyResponse | null>(null);
  const [classifying, setClassifying] = useState(false);

  const mapPoints: MarkerPoint[] = (data?.geojson.features ?? []).slice(0, 1500).map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const zone = f.properties.ecological_class;
    const risk = f.properties.bycatch_risk_score;
    const shap = (f.properties.shap_top3 ?? []).map((s: SHAPEntry) => s.feature).join(", ");
    return {
      lat, lng, color: sfzFoliumColor(zone),
      tooltip: `${zone} | Risk: ${risk.toFixed(2)}`,
      popup: `<b>Zone:</b> ${zone}<br><b>Risk:</b> ${risk.toFixed(2)}<br><b>SHAP:</b> ${shap || "—"}`,
    };
  });

  // SHAP feature frequency
  const featureCounts: Record<string, number> = {};
  for (const f of data?.geojson.features ?? []) {
    for (const s of f.properties.shap_top3 ?? []) {
      const name = (s as SHAPEntry).feature;
      featureCounts[name] = (featureCounts[name] ?? 0) + 1;
    }
  }
  const shapData = Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  async function handleClassify(e: React.FormEvent) {
    e.preventDefault();
    setClassifying(true);
    try {
      const res = await apiPost<SFZClassifyResponse>("/api/v1/sfz/classify", form);
      setResult(res);
    } finally { setClassifying(false); }
  }

  const insight = interpretSFZ(summary.GREEN ?? 0, summary.AMBER ?? 0, summary.RED ?? 0, data?.total_zones ?? 0);

  return (
    <div className="animate-page-enter space-y-6 mb-12">
      <HeroBanner
        title="Sustainable Fishing Zones"
        description={'Where is it safe and sustainable to fish this week? Green = go, amber = caution, red = avoid. <span style="opacity:.6">XGBoost weekly classifier, SHAP-explained</span>'}
      />

      <InsightCard severity={insight.severity} headline={insight.headline} body={insight.body} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="GREEN" value={summary.GREEN ?? 0} />
        <MetricCard label="AMBER" value={summary.AMBER ?? 0} />
        <MetricCard label="RED" value={summary.RED ?? 0} />
        <MetricCard label="Total Zones" value={data?.total_zones ?? 0} />
      </div>

      {isLoading ? <LoadingSpinner text="Loading SFZ zones..." /> : (
        <div className="relative animate-data-enter">
          <MapContainer height="480px" points={mapPoints} />
          <MapLegend title="Fishing Zone" items={[
            { color: "#4caf50", label: "GREEN — Recommended" },
            { color: "#ff9800", label: "AMBER — Caution" },
            { color: "#f44336", label: "RED — Avoid" },
          ]} />
        </div>
      )}

      {/* Advanced Tools */}
      {shapData.length > 0 && (
        <AdvancedPanel title="What's driving these classifications (SHAP)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shapData} layout="vertical">
              <XAxis type="number" tick={{ fill: "#8a9698", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#6d7e80", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#26a69a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AdvancedPanel>
      )}

      <AdvancedPanel title="Model playground — classify a custom point">
        <form onSubmit={handleClassify} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(form).map(([key, val]) => (
            <label key={key} className="block">
              <span className="text-xs text-text-muted">{key.replace(/_/g, " ")}</span>
              <input type="number" step="0.1" value={val}
                onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
            </label>
          ))}
          <button type="submit" disabled={classifying}
            className="col-span-2 md:col-span-4 bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
            {classifying ? "Classifying..." : "Classify Zone"}
          </button>
        </form>
        {result && (
          <div className="mt-4 flex items-center gap-4">
            <ResultBadge label={result.ecological_class} color={sfzColor(result.ecological_class)} size="lg" />
            <span className="text-text-muted">Bycatch Risk: <b className="text-text">{result.bycatch_risk_score.toFixed(3)}</b></span>
            <span className="text-text-faint">Top: {result.shap_top3.map((s) => s.feature).join(", ")}</span>
          </div>
        )}
      </AdvancedPanel>
    </div>
  );
}
