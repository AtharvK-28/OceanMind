"use client";
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { apiPost } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
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

const VERDICT_STYLE: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  GO:      { color: "#2f6f4c", bg: "#eaf3ef", border: "#cfe6dd", icon: "ph-fill ph-check-circle" },
  CAUTION: { color: "#8f6516", bg: "#fbf2e4", border: "#efe2cc", icon: "ph-fill ph-warning" },
  AVOID:   { color: "#9d3c29", bg: "#f6e6e1", border: "#e8cabf", icon: "ph-fill ph-x-circle" },
};

const SPOTS = [
  { name: "Kochi Shelf", lat: 9.5, lon: 75.5, region: "Kerala" },
  { name: "Veraval Bank", lat: 20.9, lon: 69.5, region: "Gujarat" },
  { name: "Mangalore", lat: 12.5, lon: 74.5, region: "Karnataka" },
  { name: "Vizag Deep", lat: 17.2, lon: 83.0, region: "Andhra Pradesh" },
  { name: "Lakshadweep", lat: 10.5, lon: 72.0, region: "Islands" },
  { name: "Chennai Coast", lat: 13.0, lon: 80.5, region: "Tamil Nadu" },
];

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
  const { t } = useI18n();
  const [form, setForm] = useState({ lat: SPOTS[0].lat, lon: SPOTS[0].lon, site_name: SPOTS[0].name });
  const [result, setResult] = useState<AdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function fetchFor(next: { lat: number; lon: number; site_name: string }) {
    setForm(next);
    setLoading(true);
    setError(null);
    try {
      setResult(await apiPost<AdvisoryResponse>("/api/v1/fishing/advisory", next));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg.includes("on land") ? t("adv.onLand") : t("adv.failed"));
      setResult(null);
    } finally { setLoading(false); }
  }

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; fetchFor(form); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use the phone's GPS instead of making a fisher type coordinates.
  function useMyLocation() {
    if (!navigator.geolocation) {
      setError(t("fisher.gpsUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        fetchFor({
          lat: +pos.coords.latitude.toFixed(3),
          lon: +pos.coords.longitude.toFixed(3),
          site_name: t("fisher.myLocation"),
        });
      },
      () => {
        setLocating(false);
        setError(t("fisher.gpsDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function getAdvisory(e: React.FormEvent) {
    e.preventDefault();
    fetchFor(form);
  }

  const adv = result?.advisory;
  const vs = adv ? VERDICT_STYLE[adv.recommendation] : null;

  const sstChartData = adv?.sst_history.map((d) => ({ time: formatShortTime(d.time), sst: d.value })) ?? [];
  const waveChartData = adv?.wave_forecast.map((d) => ({ time: formatTime(d.time), wave: d.value })) ?? [];
  const windChartData = adv?.wind_forecast.map((d) => ({ time: formatTime(d.time), wind: d.value })) ?? [];

  return (
    <div className="animate-page-enter">
      <HeroBanner title={t("adv.title")} description={t("adv.subtitle")} />

      {/* Location picks: GPS first, then tappable spots */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-6">
        <div>
          <button onClick={useMyLocation} disabled={locating || loading}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50">
            <i className={`ph ${locating ? "ph-circle-notch animate-spin" : "ph-crosshair"}`} style={{ fontSize: 17 }} />
            {locating ? t("fisher.locating") : t("fisher.useLocation")}
          </button>
          <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{t("adv.orTap")}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {SPOTS.map((loc) => (
              <button key={loc.name} onClick={() => fetchFor({ lat: loc.lat, lon: loc.lon, site_name: loc.name })}
                disabled={loading}
                className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3 text-left hover:border-accent/30 hover:-translate-y-0.5 transition-all disabled:opacity-60"
                style={{
                  boxShadow: "0 1px 2px rgba(23,48,57,0.04)",
                  borderColor: form.site_name === loc.name ? "#1f7a8c" : "#ece5d6",
                }}>
                <span className="w-8 h-8 flex-none rounded-lg bg-[#eaf3ef] text-accent flex items-center justify-center">
                  <i className="ph ph-map-pin" style={{ fontSize: 16 }} />
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-text">{loc.name}</div>
                  <div className="text-[10px] text-text-muted">{loc.region}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Manual coordinates — researcher/power-user path, collapsed by default */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-accent transition-colors mb-3">
            <i className={`ph ${showAdvanced ? "ph-caret-down" : "ph-caret-right"}`} style={{ fontSize: 12 }} />
            {t("adv.advanced")}
          </button>
          {showAdvanced && (
            <form onSubmit={getAdvisory} className="grid grid-cols-3 gap-4 animate-data-enter">
              <label className="block">
                <span className="text-xs text-text-muted">{t("adv.lat")}</span>
                <input type="number" step="0.1" value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: +e.target.value })}
                  className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2.5 text-sm text-text" />
              </label>
              <label className="block">
                <span className="text-xs text-text-muted">{t("adv.lon")}</span>
                <input type="number" step="0.1" value={form.lon}
                  onChange={(e) => setForm({ ...form, lon: +e.target.value })}
                  className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2.5 text-sm text-text" />
              </label>
              <label className="block">
                <span className="text-xs text-text-muted">{t("adv.site")}</span>
                <input type="text" value={form.site_name}
                  onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                  className="w-full mt-1 bg-white border border-card-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-faint" />
              </label>
              <button type="submit" disabled={loading}
                className="col-span-3 bg-accent hover:bg-accent-dark text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <i className="ph ph-compass" style={{ fontSize: 17 }} />
                {t("adv.getBtn")}
              </button>
            </form>
          )}
        </div>

        {/* What you get panel */}
        <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
          <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{t("adv.what")}</h3>
          {[
            { icon: "ph ph-thermometer-simple", label: t("adv.whatSst"), desc: t("adv.whatSstDesc") },
            { icon: "ph ph-waves", label: t("adv.whatWave"), desc: t("adv.what3d") },
            { icon: "ph ph-wind", label: t("adv.whatWind"), desc: t("adv.what3d") },
            { icon: "ph ph-target", label: t("adv.whatScore"), desc: t("adv.whatScoreDesc") },
            { icon: "ph ph-clock", label: t("adv.whatWindows"), desc: t("adv.whatWindowsDesc") },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-2.5 border-t border-[#f0ebdf] first:border-0">
              <i className={`${item.icon} text-[16px] text-accent`} />
              <div>
                <div className="text-[12.5px] font-medium text-text">{item.label}</div>
                <div className="text-[10.5px] text-text-muted">{item.desc}</div>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-[#f0ebdf] text-[10px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Source: Open-Meteo Marine API · ERA5 + GFS · Free, no key
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner text={t("verdict.loading")} />}

      {error && !loading && (
        <div className="rounded-xl border border-[#c25a44]/30 bg-[#c25a44]/10 p-4 text-[#c25a44] text-sm">
          {error}
        </div>
      )}

      {adv && !loading && (
        <div className="space-y-6">
          {/* Verdict banner — the answer, first */}
          <div className="rounded-2xl border p-5" style={{ background: vs?.bg, borderColor: vs?.border }}>
            <div className="flex items-center gap-4 mb-3">
              <i className={`${vs?.icon} text-[44px]`} style={{ color: vs?.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-black leading-none" style={{ color: vs?.color, fontFamily: "'Newsreader', serif" }}>
                  {t(`verdict.${adv.recommendation}`)}
                </div>
                <div className="text-[13px] mt-1" style={{ color: vs?.color }}>{t(`verdict.${adv.recommendation}.desc`)}</div>
                <div className="text-xs text-text-faint mt-1">
                  {result?.site.name} ({result?.site.region}) · {result?.data_source}
                </div>
              </div>
              <div className="text-right flex-none">
                <div className="text-4xl font-black" style={{ color: vs?.color, fontFamily: "'IBM Plex Mono', monospace" }}>{adv.fishing_score}</div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: vs?.color, opacity: 0.7 }}>{t("verdict.score")}</div>
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

          {/* Best fishing windows — the actionable "when", before the charts */}
          {adv.best_windows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">{t("adv.bestWindows")}</h3>
              <div className="flex flex-wrap gap-2">
                {adv.best_windows.map((w, i) => {
                  const scoresVary = new Set(adv.best_windows.map((x) => x.score)).size > 1;
                  return (
                    <div key={i} className="bg-[#3a8c5f]/10 border border-[#3a8c5f]/20 rounded-lg px-3 py-2 text-sm">
                      <span className="text-[#3a8c5f] font-medium">{formatTime(w.time)}</span>
                      {scoresVary && <span className="text-text-faint ml-2">{t("adv.scoreWord")} {w.score}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current conditions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label={t("adv.sstNow")} value={adv.current.sst_c != null ? `${adv.current.sst_c}°C` : "—"} />
            <MetricCard label={t("adv.sstTrend")} value={adv.sst_trend_c != null ? `${adv.sst_trend_c > 0 ? "+" : ""}${adv.sst_trend_c}°C` : "—"} />
            <MetricCard label={t("adv.wave")} value={adv.current.wave_height_m != null ? `${adv.current.wave_height_m}m` : "—"} />
            <MetricCard label={t("adv.wind")} value={adv.current.wind_speed_kmh != null ? `${adv.current.wind_speed_kmh} km/h` : "—"} />
            <MetricCard label={t("adv.cloud")} value={adv.current.cloud_cover_pct != null ? `${adv.current.cloud_cover_pct}%` : "—"} />
          </div>

          {/* SST history chart */}
          {sstChartData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-2">{t("adv.sstChart")}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sstChartData}>
                  <XAxis dataKey="time" tick={{ fill: "#8a9698", fontSize: 10 }} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#8a9698", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ece5d6" }} />
                  <ReferenceLine y={26} stroke="rgba(76,175,80,0.3)" strokeDasharray="3 3" label={{ value: "26°C", fill: "#8a9698", fontSize: 10 }} />
                  <ReferenceLine y={30} stroke="rgba(244,67,54,0.3)" strokeDasharray="3 3" label={{ value: "30°C", fill: "#8a9698", fontSize: 10 }} />
                  <Line type="monotone" dataKey="sst" stroke="#1f7a8c" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Wave + Wind forecast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {waveChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-muted mb-2">{t("adv.waveChart")}</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={waveChartData}>
                    <XAxis dataKey="time" tick={{ fill: "#8a9698", fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#8a9698", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ece5d6" }} />
                    <ReferenceLine y={1.5} stroke="rgba(244,67,54,0.4)" strokeDasharray="3 3" />
                    <Bar dataKey="wave" fill="#1f7a8c" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {windChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-muted mb-2">{t("adv.windChart")}</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={windChartData}>
                    <XAxis dataKey="time" tick={{ fill: "#8a9698", fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#8a9698", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #ece5d6" }} />
                    <ReferenceLine y={20} stroke="rgba(255,152,0,0.4)" strokeDasharray="3 3" />
                    <Bar dataKey="wind" fill="#ffa726" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
