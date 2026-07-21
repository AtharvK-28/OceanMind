"use client";
import { useEffect, useRef, useState } from "react";
import { haversineKm } from "@/lib/geo";
import { sendSosWithLocation } from "@/lib/sos";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

interface TripState {
  startedAt: number;
  home: { lat: number; lon: number };
  homeName: string;
  returnByTs: number;
  maxOffshoreKm: number;
  distFromHomeKm: number;
}

const KEY = "oceanmind_trip";

function fmtDur(min: number) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function TripPanel({
  home, homeName, returnBy,
}: { home: { lat: number; lon: number }; homeName: string; returnBy: Date }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [trip, setTrip] = useState<TripState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [summary, setSummary] = useState<{ durMin: number; maxKm: number } | null>(null);
  const watchRef = useRef<number | null>(null);

  // Restore an in-progress trip across reloads
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) { try { setTrip(JSON.parse(raw)); } catch { /* ignore */ } }
  }, []);

  // Persist
  useEffect(() => {
    if (trip) localStorage.setItem(KEY, JSON.stringify(trip));
    else localStorage.removeItem(KEY);
  }, [trip]);

  // Ticking clock while a trip is active
  useEffect(() => {
    if (!trip) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [trip?.startedAt]);

  // Live GPS breadcrumb: track distance from home + farthest offshore
  useEffect(() => {
    if (!trip || !("geolocation" in navigator)) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const lat = p.coords.latitude, lon = p.coords.longitude;
        setTrip((cur) => {
          if (!cur) return cur;
          const d = haversineKm(cur.home.lat, cur.home.lon, lat, lon);
          return { ...cur, distFromHomeKm: d, maxOffshoreKm: Math.max(cur.maxOffshoreKm, d) };
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); };
  }, [trip?.startedAt]);

  function startTrip() {
    setSummary(null);
    setTrip({ startedAt: Date.now(), home, homeName, returnByTs: returnBy.getTime(), maxOffshoreKm: 0, distFromHomeKm: 0 });
  }
  function endTrip() {
    if (trip) setSummary({ durMin: Math.round((Date.now() - trip.startedAt) / 60000), maxKm: trip.maxOffshoreKm });
    setTrip(null);
  }

  // ── Inactive: start button (+ last-trip summary) ──────────────────────────
  if (!trip) {
    return (
      <div className="mb-4">
        {summary && (
          <div className="mb-2 text-center text-[12px] text-text-muted">
            {t("trip.summary", { dur: fmtDur(summary.durMin), km: summary.maxKm.toFixed(1) })}
          </div>
        )}
        <button onClick={startTrip}
          className="w-full flex items-center justify-center gap-2 bg-white border border-card-border text-[#2a6f7c] rounded-2xl py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-accent/30">
          <i className="ph ph-path text-[18px]" /> {t("trip.start")}
        </button>
      </div>
    );
  }

  // ── Active ────────────────────────────────────────────────────────────────
  const elapsedMin = Math.floor((now - trip.startedAt) / 60000);
  const msLeft = trip.returnByTs - now;
  const overdue = msLeft <= 0;
  const timeLeftStr = overdue ? "0m" : fmtDur(Math.floor(msLeft / 60000));
  const returnByLabel = new Date(trip.returnByTs).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  if (overdue) {
    return (
      <div className="mb-4 rounded-2xl border p-4 animate-data-enter"
           style={{ background: "#f6e6e1", borderColor: "#e8cabf" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c0392b] animate-pulse" />
          <span className="text-[15px] font-bold text-[#9d3c29]">{t("trip.overdue")}</span>
          <span className="ml-auto text-[11px] text-[#9d3c29]/70" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtDur(elapsedMin)} · {trip.distFromHomeKm.toFixed(1)} km</span>
        </div>
        <p className="text-[12.5px] text-[#9d3c29] mb-3">{t("trip.overdueDesc")}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => sendSosWithLocation("SOS from a fishing trip — need help.", () => toast(t("sos.sent"), "success"))}
            className="flex items-center justify-center gap-2 bg-[#c0392b] hover:bg-[#a93226] text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            <i className="ph-fill ph-siren text-[16px]" /> {t("trip.sos")}
          </button>
          <button onClick={endTrip}
            className="flex items-center justify-center gap-2 bg-white border border-[#e8cabf] text-[#9d3c29] rounded-xl py-2.5 text-sm font-semibold transition-colors">
            <i className="ph ph-check text-[16px]" /> {t("trip.imSafe")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-accent/25 bg-accent/[0.06] p-4 animate-data-enter">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
        <span className="text-[13px] font-bold text-accent uppercase tracking-wider">{t("trip.active")}</span>
        <span className="ml-auto text-[13px] font-semibold text-text" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtDur(elapsedMin)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: t("trip.fromHome"), value: `${trip.distFromHomeKm.toFixed(1)} km` },
          { label: t("trip.farthest"), value: `${trip.maxOffshoreKm.toFixed(1)} km` },
          { label: t("trip.timeLeft"), value: timeLeftStr },
        ].map((s) => (
          <div key={s.label} className="text-center bg-white/60 border border-card-border rounded-xl py-2">
            <div className="text-[15px] font-bold text-text" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.value}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-text-muted">{t("trip.returnBy")} <b className="text-text">{returnByLabel}</b></span>
        <button onClick={endTrip} className="text-[12.5px] font-semibold text-[#9d3c29] hover:underline">{t("trip.end")}</button>
      </div>
    </div>
  );
}
