"use client";
import { useState } from "react";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetcher, apiPost } from "@/lib/api";
import { sfzFoliumColor, sfzColor } from "@/lib/colors";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorState from "@/components/ui/ErrorState";
import ResultBadge from "@/components/ui/ResultBadge";
import ScoreGuide from "@/components/ui/ScoreGuide";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import type { SFZCurrentResponse, SFZClassifyResponse, SHAPEntry } from "@/types/api";

export default function SFZPage() {
  const { data, isLoading, error, mutate } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", fetcher);
  const summary = data?.zone_summary ?? {};

  const [form, setForm] = useState({ latitude: 12, longitude: 74, sst_c: 28.5, chlorophyll_mgl: 0.3, ssh_anomaly: 0, mld_m: 50, fishing_effort_h: 2, wind_stress_curl: 0 });

  const FIELD_LABELS: Record<string, string> = {
    latitude: "Latitude", longitude: "Longitude", sst_c: "SST (°C)",
    chlorophyll_mgl: "Chlorophyll-a (mg/L)", ssh_anomaly: "SSH anomaly (m)",
    mld_m: "Mixed layer depth (m)", fishing_effort_h: "Fishing effort (h)",
    wind_stress_curl: "Wind stress curl",
  };
  const [result, setResult] = useState<SFZClassifyResponse | null>(null);
  const [classifying, setClassifying] = useState(false);

  const mapPoints: MarkerPoint[] = (data?.geojson.features ?? []).slice(0, 1500).map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const zone = f.properties.ecological_class;
    const risk = f.properties.bycatch_risk_score;
    const shap = (f.properties.shap_top3 ?? []).map((s: SHAPEntry) => s.feature.replace(/_/g, " ")).join(", ");
    
    let actionText = "";
    if (zone === "GREEN") actionText = "Safe to fish. Favorable conditions.";
    else if (zone === "AMBER") actionText = "Proceed with caution. Check bycatch risks.";
    else actionText = "Avoid this zone. High ecological stress.";

    return {
      lat, lng, color: sfzFoliumColor(zone),
      tooltip: `${zone} | Action: ${actionText}`,
      popup: `<b>Zone:</b> ${zone}<br><b>Action:</b> ${actionText}<br><b>Bycatch Risk:</b> ${risk.toFixed(2)}<br><b>Drivers:</b> ${shap || "—"}`,
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

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Sustainable Fishing Zones"
        description="<b>XGBoost</b> weekly classifier with <b>SHAP</b> explainability. Green = recommended · Amber = caution · Red = avoid."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="GREEN" value={summary.GREEN ?? 0} valueColor="#3a8c5f" />
        <MetricCard label="AMBER" value={summary.AMBER ?? 0} valueColor="#d49a2e" />
        <MetricCard label="RED" value={summary.RED ?? 0} valueColor="#c25a44" />
        <MetricCard label="Total Zones" value={data?.total_zones ?? 0} />
      </div>

      {error ? <ErrorState message="Couldn't load fishing zones" onRetry={() => mutate()} /> : isLoading ? <LoadingSpinner text="Loading SFZ zones..." /> : (
        <div className="relative animate-data-enter">
          <MapContainer height="480px" points={mapPoints} />
          <MapLegend title="Fishing Zone" items={[
            { color: "#4caf50", label: "GREEN — Recommended" },
            { color: "#ff9800", label: "AMBER — Caution" },
            { color: "#f44336", label: "RED — Avoid" },
          ]} />
        </div>
      )}

      {/* SHAP chart */}
      {shapData.length > 0 && (
        <div className="mt-6 bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">SHAP Feature Importance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shapData} layout="vertical">
              <XAxis type="number" tick={{ fill: "#8a9698", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#6d7e80", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#26a69a" radius={[0, 6, 6, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Single classify */}
      <div className="mt-6 bg-white border border-card-border rounded-2xl p-6" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Classify a Single Location</h3>
        <form onSubmit={handleClassify} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(form).map(([key, val]) => (
            <label key={key} className="block">
              <span className="text-xs text-text-muted">{FIELD_LABELS[key] ?? key.replace(/_/g, " ")}</span>
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
      </div>

      <ScoreGuide
        title="What do the zone colours and the bycatch risk score mean?"
        intro="Each grid cell is classified weekly by an XGBoost model into GREEN, AMBER or RED. The classification is driven by a bycatch risk score from 0 to 1 — the modelled probability that fishing this cell brings up non-target species, juveniles or protected animals alongside the catch. Lower is better."
        bandsHeading="What the zone colours mean"
        bands={[
          { range: "risk < 0.33", label: "GREEN · Recommended", color: "#3a8c5f", meaning: "Good target-species availability with low bycatch probability. The productive, clean cells.", action: "Fish here first. These are the cells the advisory routes you to." },
          { range: "0.33 – 0.66", label: "AMBER · Caution", color: "#d49a2e", meaning: "Workable, but with a meaningfully higher chance of hauling up unintended species.", action: "Fish selectively — larger mesh, shorter sets, and check the haul carefully." },
          { range: "risk > 0.66", label: "RED · Avoid", color: "#c25a44", meaning: "High bycatch probability, often overlapping juvenile grounds or protected species habitat.", action: "Avoid. Geofencing will warn you if you drift into one of these cells." },
        ]}
        factorsHeading="What drives the classification"
        factors={[
          { name: "Sea surface temperature", detail: "Sets the thermal habitat — species aggregate within fairly narrow bands." },
          { name: "Chlorophyll-a", detail: "A proxy for productivity. Blooms concentrate forage fish, and predators follow." },
          { name: "Sea surface height anomaly", detail: "Reveals eddies and fronts, which are where prey concentrates." },
          { name: "Mixed layer depth", detail: "How deep the well-mixed surface reaches — controls where fish sit in the column." },
          { name: "Fishing effort (AIS)", detail: "Existing pressure on the cell. Heavily-worked ground carries more bycatch risk." },
          { name: "Wind stress curl", detail: "Drives upwelling, which brings nutrients up and productivity with them." },
        ]}
        method="Model: XGBoost classifier, retrained weekly. Every cell carries SHAP values naming the three features that most influenced its own classification — tap a zone on the map to see why that specific cell was graded the way it was. This is a recommendation to improve catch quality and reduce bycatch, not a legal restriction; closed seasons and no-take areas are enforced separately on the compliance page."
      />
    </div>
  );
}
