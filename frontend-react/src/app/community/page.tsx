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
import type { CatchRecord } from "@/types/api";

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
