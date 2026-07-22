"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { apiGet } from "@/lib/api";
import { haversineKm } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import ErrorState from "@/components/ui/ErrorState";
import CatchPhotoScan from "@/components/ui/CatchPhotoScan";
import { refreshLedger } from "@/lib/ledger";
import { useToast } from "@/components/ui/Toast";
import { apiPost } from "@/lib/api";
import { SPECIES_OPTIONS, LANDING_SITES } from "@/lib/constants";
import type { CatchRecord, CatchTraceResponse } from "@/types/api";

// Port coordinates used as the "near you" reference point (matches Fisher View).
const PORT_COORDS: Record<string, { lat: number; lon: number }> = {
  "Veraval, Gujarat":     { lat: 20.9, lon: 70.3 },
  "Kochi, Kerala":        { lat: 9.97, lon: 76.26 },
  "Chennai, Tamil Nadu":  { lat: 13.08, lon: 80.27 },
  "Visakhapatnam, AP":    { lat: 17.69, lon: 83.22 },
  "Mangalore, Karnataka": { lat: 12.87, lon: 74.88 },
};

const SPECIES_ICON = "ph ph-fish-simple";

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}
function recencyColor(h: number) {
  if (h < 6) return "#3a8c5f";   // fresh
  if (h < 24) return "#d49a2e";  // today
  return "#8a9698";              // older
}

const fetchHistory = (path: string) => apiGet<{ records: CatchRecord[] }>(path).then((r) => r.records);

export default function CommunityPage() {
  const { t } = useI18n();
  // This SWR key is shared with pages whose fetcher returns the raw { records }
  // envelope, so accept either shape rather than assuming an array.
  const { data: raw, isLoading, error, mutate } = useSWR<CatchRecord[] | { records: CatchRecord[] }>("/api/v1/trace/history", fetchHistory, { refreshInterval: 15000 });
  const records: CatchRecord[] = Array.isArray(raw) ? raw : (raw?.records ?? []);

  // Reference point = saved port (fallback Veraval), unless the fisher has
  // opted into real GPS (shared preference with Fisher View — no re-prompt).
  const [portRef, setPortRef] = useState(PORT_COORDS["Veraval, Gujarat"]);
  useEffect(() => {
    const saved = localStorage.getItem("oceanmind_port");
    if (saved && PORT_COORDS[saved]) setPortRef(PORT_COORDS[saved]);
  }, []);

  const [geo, setGeo] = useState<{ lat: number; lon: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "error">("idle");
  function useMyLocation() {
    if (!("geolocation" in navigator)) { setGeoStatus("error"); return; }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGeoStatus("idle"); localStorage.setItem("oceanmind_use_geo", "1"); },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }
  const geoAutoTried = useRef(false);
  useEffect(() => {
    if (geoAutoTried.current) return;
    geoAutoTried.current = true;
    if (localStorage.getItem("oceanmind_use_geo") === "1") useMyLocation();
  }, []);

  const ref = geo ?? portRef;

  const [species, setSpecies] = useState<string>("__all__");

  const speciesList = useMemo(
    () => Array.from(new Set(records.map((r) => r.species_name))).sort(),
    [records]
  );

  const filtered = useMemo(
    () => records.filter((r) => species === "__all__" || r.species_name === species),
    [records, species]
  );

  const enriched = useMemo(
    () =>
      filtered
        .map((r) => ({ ...r, distKm: haversineKm(ref.lat, ref.lon, r.latitude, r.longitude), hrs: hoursSince(r.event_timestamp) }))
        // Nearest first — this feed promises "catches near you"; sorting by
        // recency alone let catches 1000+ km away outrank ones next door.
        .sort((a, b) => a.distKm - b.distKm),
    [filtered, ref]
  );

  const mapPoints: MarkerPoint[] = enriched.map((r) => ({
    lat: r.latitude, lng: r.longitude,
    color: recencyColor(r.hrs),
    radius: Math.max(6, Math.min(16, r.quantity_kg / 22)),
    fillOpacity: 0.7,
    tooltip: `${r.species_name} · ${r.quantity_kg}kg · ${r.hrs < 1 ? t("comm.justNow") : t("comm.hoursAgo", { h: Math.floor(r.hrs) })}`,
  }));

  const totalKg = filtered.reduce((s, r) => s + r.quantity_kg, 0);
  const reporters = new Set(records.map((r) => r.fisher_token || r.transaction_id)).size;

  // ── Report a catch ───────────────────────────────────────────────────────
  // The community map is only as good as what fishers put into it, so the
  // report action lives here rather than only on Fisher View — you contribute
  // from the same screen that shows you what everyone else landed.
  const { toast } = useToast();
  const [showReport, setShowReport] = useState(false);
  const [form, setForm] = useState({ species: Object.keys(SPECIES_OPTIONS)[0], quantity_kg: 40 });
  const [logging, setLogging] = useState(false);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    try {
      const speciesName = form.species.split(" (")[0];
      const res = await apiPost<CatchTraceResponse>("/api/v1/trace/catch", {
        species_aphia_id: SPECIES_OPTIONS[form.species],
        species_name: speciesName,
        quantity_kg: form.quantity_kg,
        latitude: ref.lat,
        longitude: ref.lon,
        landing_site_id: Object.values(LANDING_SITES)[0],
      });
      toast(t("form.recorded", { n: res.block_number }), "success");
      setShowReport(false);
      await refreshLedger(); // new catch appears on the map and feed immediately
    } catch {
      toast("Couldn't record the catch — try again.", "error");
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="animate-page-enter">
      <div className="flex justify-end mb-2">
        {geo ? (
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/25 rounded-lg px-3 py-1.5">
            <i className="ph-fill ph-crosshair text-accent" style={{ fontSize: 13 }} />
            <span className="text-[12.5px] font-semibold text-accent">{t("fisher.myLocation")}</span>
          </div>
        ) : (
          <button onClick={useMyLocation} disabled={geoStatus === "locating"}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:text-accent-dark transition-colors disabled:opacity-60">
            <i className={`ph ${geoStatus === "locating" ? "ph-circle-notch animate-spin" : "ph-crosshair"}`} style={{ fontSize: 13 }} />
            {geoStatus === "locating" ? t("fisher.locating") : t("fisher.useLocation")}
          </button>
        )}
      </div>

      <HeroBanner title={t("comm.title")} description={t("comm.subtitle")} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label={t("comm.catches")} value={records.length} icon="ph ph-fish" />
        <MetricCard label={t("comm.landed")} value={`${Math.round(totalKg)} kg`} icon="ph ph-scales" />
        <MetricCard label={t("comm.species")} value={speciesList.length} icon="ph ph-dna" />
        <MetricCard label={t("comm.reporters")} value={reporters} icon="ph ph-users-three" />
      </div>

      {/* Report your catch — the contribution side of a community feed */}
      <div className="mb-5">
        {!showReport ? (
          <button onClick={() => setShowReport(true)}
            className="w-full flex items-center gap-3 bg-white border border-dashed border-accent/40 hover:border-accent
                       hover:bg-[#eaf3ef] rounded-2xl px-5 py-4 text-left transition-colors group">
            <span className="w-11 h-11 flex-none rounded-xl bg-[#eaf3ef] text-accent flex items-center justify-center group-hover:bg-white transition-colors">
              <i className="ph ph-camera text-[20px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-semibold text-text">Report your catch</span>
              <span className="block text-[12px] text-text-muted mt-0.5">
                Photograph it — the vision model names the species, and it goes on the ledger and this map for everyone.
              </span>
            </span>
            <i className="ph ph-plus text-[18px] text-accent flex-none" />
          </button>
        ) : (
          <div className="animate-data-enter bg-white border border-card-border rounded-2xl p-5"
            style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text" style={{ fontFamily: "'Newsreader', serif" }}>Report your catch</h3>
              <button onClick={() => setShowReport(false)} aria-label="Close" className="text-text-faint hover:text-text-muted text-lg leading-none">&times;</button>
            </div>

            <div className="pb-4 mb-4 border-b border-[#f0ebdf]">
              <CatchPhotoScan lat={ref.lat} lon={ref.lon}
                onDetect={(d) => {
                  const match = Object.keys(SPECIES_OPTIONS).find((s) =>
                    s.toLowerCase().startsWith(d.common.toLowerCase().slice(0, 6))
                  );
                  if (match) setForm((f) => ({ ...f, species: match }));
                }} />
            </div>

            <form onSubmit={submitReport} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <label className="block">
                <span className="text-xs text-text-muted">{t("form.species")}</span>
                <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}
                  className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2.5 text-sm text-text">
                  {Object.keys(SPECIES_OPTIONS).map((s) => <option key={s} value={s}>{s.split(" (")[0]}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-text-muted">{t("form.quantity")}</span>
                <input type="number" min={1} value={form.quantity_kg}
                  onChange={(e) => setForm({ ...form, quantity_kg: +e.target.value })}
                  className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2.5 text-sm text-text" />
              </label>
              <button type="submit" disabled={logging}
                className="bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
                {logging ? t("form.logging") : t("form.record")}
              </button>
            </form>

            <p className="text-[11px] text-text-faint mt-3 leading-snug">
              Logged at {geo ? "your GPS position" : "your saved port"} ({ref.lat.toFixed(2)}, {ref.lon.toFixed(2)}) and
              hashed into the catch ledger — it appears on the map above as soon as it&apos;s written.
            </p>
          </div>
        )}
      </div>

      {/* Species filter */}
      {speciesList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[["__all__", t("comm.all")], ...speciesList.map((s) => [s, s] as [string, string])].map(([id, label]) => (
            <button key={id} onClick={() => setSpecies(id)}
              className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all"
              style={{
                background: species === id ? "#1f7a8c" : "white",
                borderColor: species === id ? "#1f7a8c" : "#ece5d6",
                color: species === id ? "white" : "#6d7e80",
              }}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* Map */}
        <div className="relative">
          <MapContainer height="460px" center={[ref.lat, ref.lon]} zoom={6} points={mapPoints} />
          <MapLegend title={t("comm.recent")} items={[
            { color: "#3a8c5f", label: t("comm.fresh") },
            { color: "#d49a2e", label: t("comm.today") },
            { color: "#8a9698", label: t("comm.older") },
          ]} />
        </div>

        {/* Feed */}
        <div className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
          <h3 className="text-[0.7rem] uppercase tracking-wider text-text-faint font-semibold mb-3">{t("comm.recent")}</h3>
          {error ? (
            <ErrorState message="Couldn't load community catches" onRetry={() => mutate()} compact />
          ) : isLoading ? (
            <p className="text-sm text-text-faint py-4 text-center">…</p>
          ) : enriched.length === 0 ? (
            <div className="text-center py-8">
              <i className="ph ph-fish text-[36px] text-text-faint" />
              <p className="text-sm text-text-muted mt-3">{t("comm.empty")}</p>
              <a href="/" className="inline-block mt-4 bg-accent hover:bg-accent-dark text-white rounded-lg px-4 py-2 text-sm font-semibold">{t("comm.report")}</a>
            </div>
          ) : (
            <div className="divide-y divide-[#f0ebdf] max-h-[420px] overflow-y-auto">
              {enriched.slice(0, 20).map((r) => (
                <div key={r.transaction_id} className="flex items-center gap-3 py-2.5">
                  <span className="w-8 h-8 flex-none rounded-lg flex items-center justify-center" style={{ background: recencyColor(r.hrs) + "22", color: recencyColor(r.hrs) }}>
                    <i className={`${SPECIES_ICON} text-[15px]`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text truncate">{r.species_name}</div>
                    <div className="text-[11px] text-text-muted">
                      {t("comm.away", { km: r.distKm.toFixed(0) })} · {r.hrs < 1 ? t("comm.justNow") : t("comm.hoursAgo", { h: Math.floor(r.hrs) })}
                    </div>
                  </div>
                  <span className="text-[12.5px] font-medium text-text" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{r.quantity_kg} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-[0.6rem] text-text-faint mt-6">
        Community reports on the OceanMind catch ledger (SHA-256). Every logged catch improves the map for everyone.
      </div>
    </div>
  );
}
