"use client";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { apiPost } from "@/lib/api";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface TimeValue { time: string; value: number }

interface Advisory {
  current: {
    sst_c: number | null;
    wave_height_m: number | null;
    wave_period_s: number | null;
    wind_speed_kmh: number | null;
    cloud_cover_pct: number | null;
  };
  sst_7d_mean: number | null;
  sst_trend_c: number | null;
  fishing_score: number;
  recommendation: "GO" | "CAUTION" | "AVOID";
  recommendation_text: string;
  reasons_good: string[];
  reasons_bad: string[];
  best_windows: { time: string; score: number }[];
  sst_history: TimeValue[];
  wave_forecast: TimeValue[];
  wind_forecast: TimeValue[];
}

interface AdvisoryResponse {
  site: { lat: number; lon: number; name: string; region: string };
  advisory: Advisory;
  data_source: string;
  queried_at: string;
}

const SCORE_COLOR: Record<string, string> = {
  GO: "text-[#3a8c5f]",
  CAUTION: "text-[#d49a2e]",
  AVOID: "text-[#c25a44]",
};

const SCORE_BG: Record<string, string> = {
  GO: "bg-[#3a8c5f]/10 border-[#3a8c5f]/30",
  CAUTION: "bg-[#d49a2e]/10 border-[#d49a2e]/30",
  AVOID: "bg-[#c25a44]/10 border-[#c25a44]/30",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatShortTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function FishingAdvisoryPage() {
  const [form, setForm] = useState({ lat: 9.5, lon: 75.5, site_name: "Kerala Coast" });
  const [result, setResult] = useState<AdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getAdvisory(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResult(await apiPost<AdvisoryResponse>("/api/v1/fishing/advisory", form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch advisory");
      setResult(null);
    } finally { setLoading(false); }
  }

  const adv = result?.advisory;

  const sstChartData = adv?.sst_history.map((d) => ({ time: formatShortTime(d.time), sst: d.value })) ?? [];
  const waveChartData = adv?.wave_forecast.map((d) => ({ time: formatTime(d.time), wave: d.value })) ?? [];
  const windChartData = adv?.wind_forecast.map((d) => ({ time: formatTime(d.time), wind: d.value })) ?? [];

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Real-Time Fishing Advisory"
        description="Live SST, wave, and wind data from <b>Open-Meteo Marine API</b>. 7-day history + 3-day forecast → actionable GO / CAUTION / AVOID recommendation."
      />

      <form onSubmit={getAdvisory} className="max-w-2xl grid grid-cols-3 gap-4 mb-6">
        <label className="block">
          <span className="text-xs text-text-muted">Latitude</span>
          <input type="number" step="0.1" value={form.lat}
            onChange={(e) => setForm({ ...form, lat: +e.target.value })}
            className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
        </label>
        <label className="block">
          <span className="text-xs text-text-muted">Longitude</span>
          <input type="number" step="0.1" value={form.lon}
            onChange={(e) => setForm({ ...form, lon: +e.target.value })}
            className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
        </label>
        <label className="block">
          <span className="text-xs text-text-muted">Site Name</span>
          <input type="text" value={form.site_name}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint" />
        </label>
        <button type="submit" disabled={loading}
          className="col-span-3 bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
          {loading ? "Fetching live data..." : "Get Fishing Advisory"}
        </button>
      </form>

      {loading && <LoadingSpinner text="Pulling real-time marine data..." />}

      {error && !loading && (
        <div className="rounded-xl border border-[#c25a44]/30 bg-[#c25a44]/10 p-4 text-[#c25a44] text-sm">
          {error.includes("on land")
            ? "Those coordinates are on land — please enter ocean coordinates within the Indian EEZ."
            : error}
        </div>
      )}

      {adv && !loading && (
        <div className="space-y-6">
          {/* Recommendation banner */}
          <div className={`rounded-xl border p-5 ${SCORE_BG[adv.recommendation]}`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`text-5xl font-black ${SCORE_COLOR[adv.recommendation]}`}>
                {adv.fishing_score}
              </div>
              <div>
                <div className={`text-xl font-bold ${SCORE_COLOR[adv.recommendation]}`}>
                  {adv.recommendation} — {adv.recommendation_text}
                </div>
                <div className="text-xs text-text-faint mt-1">
                  {result?.site.name} ({result?.site.region}) · {result?.data_source}
                </div>
              </div>
            </div>
            {adv.reasons_good.length > 0 && (
              <div className="space-y-1 mb-2">
                {adv.reasons_good.map((r, i) => (
                  <div key={i} className="text-sm text-[#3a8c5f] flex items-start gap-2">
                    <span className="mt-0.5">+</span> {r}
                  </div>
                ))}
              </div>
            )}
            {adv.reasons_bad.length > 0 && (
              <div className="space-y-1">
                {adv.reasons_bad.map((r, i) => (
                  <div key={i} className="text-sm text-[#c25a44] flex items-start gap-2">
                    <span className="mt-0.5">-</span> {r}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current conditions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="SST" value={adv.current.sst_c != null ? `${adv.current.sst_c}°C` : "—"} />
            <MetricCard label="SST Trend (7d)" value={adv.sst_trend_c != null ? `${adv.sst_trend_c > 0 ? "+" : ""}${adv.sst_trend_c}°C` : "—"} />
            <MetricCard label="Wave Height" value={adv.current.wave_height_m != null ? `${adv.current.wave_height_m}m` : "—"} />
            <MetricCard label="Wind Speed" value={adv.current.wind_speed_kmh != null ? `${adv.current.wind_speed_kmh} km/h` : "—"} />
            <MetricCard label="Cloud Cover" value={adv.current.cloud_cover_pct != null ? `${adv.current.cloud_cover_pct}%` : "—"} />
          </div>

          {/* SST history chart */}
          {sstChartData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">Sea Surface Temperature — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sstChartData}>
                  <XAxis dataKey="time" tick={{ fill: "#8a9698", fontSize: 10 }} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#8a9698", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ece5d6" }} />
                  <ReferenceLine y={26} stroke="rgba(76,175,80,0.3)" strokeDasharray="3 3" label={{ value: "26°C", fill: "#8a9698", fontSize: 10 }} />
                  <ReferenceLine y={30} stroke="rgba(244,67,54,0.3)" strokeDasharray="3 3" label={{ value: "30°C", fill: "#8a9698", fontSize: 10 }} />
                  <Line type="monotone" dataKey="sst" stroke="#1f7a8c" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Wave + Wind forecast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {waveChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-muted mb-2">Wave Height Forecast — Next 3 Days</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={waveChartData}>
                    <XAxis dataKey="time" tick={{ fill: "#8a9698", fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#8a9698", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ece5d6" }} />
                    <ReferenceLine y={1.5} stroke="rgba(244,67,54,0.4)" strokeDasharray="3 3" />
                    <Bar dataKey="wave" fill="#1f7a8c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {windChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-muted mb-2">Wind Speed Forecast — Next 3 Days</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={windChartData}>
                    <XAxis dataKey="time" tick={{ fill: "#8a9698", fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#8a9698", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ece5d6" }} />
                    <ReferenceLine y={20} stroke="rgba(255,152,0,0.4)" strokeDasharray="3 3" />
                    <Bar dataKey="wind" fill="#ffa726" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Best fishing windows */}
          {adv.best_windows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">Best Fishing Windows (next 3 days)</h3>
              <div className="flex flex-wrap gap-2">
                {adv.best_windows.map((w, i) => (
                  <div key={i} className="bg-[#3a8c5f]/10 border border-[#3a8c5f]/20 rounded-lg px-3 py-2 text-sm">
                    <span className="text-[#3a8c5f] font-medium">{formatTime(w.time)}</span>
                    <span className="text-text-faint ml-2">score {w.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
