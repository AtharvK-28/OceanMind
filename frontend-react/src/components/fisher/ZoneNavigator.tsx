"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { haversineKm, bearingDeg, compassLabel, kmToNmi } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { estimateFuelCostInr, priceForSpecies, type ZoneYieldStats } from "@/lib/economics";

export interface NavTarget {
  lat: number;
  lon: number;
  name: string;
  zoneClass: string;
}

const SPEEDS_KN = [5, 8, 12];
const ARRIVED_KM = 1.0;

export default function ZoneNavigator({ target, zoneYield, onClose }: { target: NavTarget; zoneYield?: ZoneYieldStats | null; onClose: () => void }) {
  const { t } = useI18n();
  const [pos, setPos] = useState<{ lat: number; lon: number; acc: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [speedKn, setSpeedKn] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Portal to <body> so the overlay escapes any transformed ancestor
  // (the page's animate-page-enter transform would otherwise trap `fixed`).
  useEffect(() => setMounted(true), []);

  // Live GPS position
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError(t("nav.gpsError"));
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy });
        setError(null);
      },
      () => setError(t("nav.gpsError")),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Device compass heading (best-effort; iOS needs a permission gesture)
  useEffect(() => {
    function handle(e: DeviceOrientationEvent) {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let hdg: number | null = null;
      if (typeof ev.webkitCompassHeading === "number" && !isNaN(ev.webkitCompassHeading)) {
        hdg = ev.webkitCompassHeading; // iOS: 0 = north, clockwise
      } else if (ev.alpha != null) {
        hdg = (360 - ev.alpha) % 360; // standard alpha is counter-clockwise
      }
      if (hdg != null) setHeading(hdg);
    }

    async function start() {
      const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (D && typeof D.requestPermission === "function") {
        try { await D.requestPermission(); } catch { /* denied — fall back to north-up */ }
      }
      window.addEventListener("deviceorientationabsolute", handle as EventListener, true);
      window.addEventListener("deviceorientation", handle as EventListener, true);
    }
    start();
    return () => {
      window.removeEventListener("deviceorientationabsolute", handle as EventListener, true);
      window.removeEventListener("deviceorientation", handle as EventListener, true);
    };
  }, []);

  const distanceKm = pos ? haversineKm(pos.lat, pos.lon, target.lat, target.lon) : null;
  const bearing = pos ? bearingDeg(pos.lat, pos.lon, target.lat, target.lon) : null;
  const arrived = distanceKm != null && distanceKm <= ARRIVED_KM;
  // Arrow points to target relative to where the phone faces; north-up if no compass.
  const arrowDeg = bearing == null ? 0 : heading != null ? bearing - heading : bearing;
  const etaMin = distanceKm != null ? (distanceKm / (speedKn * 1.852)) * 60 : null;

  // Trip economics — live fuel estimate (round trip, current speed) vs. the real
  // catch-yield history near this zone from the ledger. Never fabricated: the
  // catch side is only shown when the fleet has actually logged nearby.
  const fuelCostInr = distanceKm != null ? estimateFuelCostInr(distanceKm, speedKn) : null;
  const catchValueInr = zoneYield && zoneYield.count > 0
    ? Math.round(zoneYield.avgKg * priceForSpecies(zoneYield.topSpecies))
    : null;
  const netInr = fuelCostInr != null && catchValueInr != null ? catchValueInr - fuelCostInr : null;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col text-white"
         style={{ background: "linear-gradient(178deg, #16434c 0%, #0e2d34 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#9fe0d6]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{t("nav.headingTo")}</div>
          <div className="text-[19px] font-semibold truncate" style={{ fontFamily: "'Newsreader', serif" }}>{target.name}</div>
        </div>
        <button onClick={onClose} aria-label="Close"
          className="w-10 h-10 flex-none rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-colors">
          &times;
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {error ? (
          <div className="text-center max-w-xs">
            <i className="ph ph-map-pin-slash text-[46px] text-[#e8a49a]" />
            <p className="mt-3 text-[15px] text-white/80">{error}</p>
          </div>
        ) : arrived ? (
          <div className="text-center animate-data-enter">
            <div className="w-24 h-24 mx-auto rounded-full bg-[#3a8c5f]/25 border border-[#6fce9c]/40 flex items-center justify-center">
              <i className="ph-fill ph-check-circle text-[56px] text-[#8fe0b0]" />
            </div>
            <div className="text-2xl font-black mt-5" style={{ fontFamily: "'Newsreader', serif" }}>{t("nav.arrived")}</div>
            <div className="text-white/60 text-sm mt-1">{target.name}</div>
          </div>
        ) : distanceKm == null || bearing == null ? (
          <div className="flex flex-col items-center gap-3 text-white/70">
            <i className="ph ph-circle-notch animate-spin text-[30px]" />
            <span className="text-sm">{t("nav.gpsWait")}</span>
          </div>
        ) : (
          <>
            {/* Compass dial (north-up) */}
            <div className="relative" style={{ width: 264, height: 264 }}>
              <div className="absolute inset-0 rounded-full border-2 border-white/12"
                   style={{ background: "radial-gradient(circle at 50% 40%, rgba(159,224,214,0.10), rgba(0,0,0,0.20))" }} />
              {/* Cardinal marks */}
              {[["N", "top-2 left-1/2 -translate-x-1/2"], ["E", "right-2 top-1/2 -translate-y-1/2"], ["S", "bottom-2 left-1/2 -translate-x-1/2"], ["W", "left-2 top-1/2 -translate-y-1/2"]].map(([c, cls]) => (
                <span key={c} className={`absolute ${cls} text-[12px] font-semibold ${c === "N" ? "text-[#e8a49a]" : "text-white/45"}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{c}</span>
              ))}
              {/* Arrow */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${arrowDeg}deg)` }}>
                <svg width="120" height="180" viewBox="0 0 120 180">
                  <polygon points="60,8 92,150 60,126 28,150" fill="#9fe0d6" />
                  <polygon points="60,8 60,126 28,150" fill="#7ecec0" />
                </svg>
              </div>
              {/* Center hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/80 border-2 border-[#16434c]" />
            </div>

            {/* Distance + bearing */}
            <div className="mt-8 text-center">
              <div className="text-[46px] font-black leading-none" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)}<span className="text-xl font-normal text-white/60"> km</span>
              </div>
              <div className="text-[13px] text-white/60 mt-1">
                {kmToNmi(distanceKm).toFixed(1)} nmi · {Math.round(bearing)}° {compassLabel(bearing)}
              </div>
              <div className="text-[12px] text-[#9fe0d6] mt-1">{heading != null ? t("nav.steer") : t("nav.northUp")}</div>
            </div>

            {/* ETA + speed */}
            <div className="mt-6 w-full max-w-xs bg-white/8 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/60">{t("nav.eta")}</span>
                <span className="text-[17px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {etaMin != null ? (etaMin < 1 ? `<1 ${t("nav.min")}` : `~${Math.round(etaMin)} ${t("nav.min")}`) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px] text-white/60">{t("nav.speed")}</span>
                <div className="inline-flex rounded-lg bg-black/20 p-0.5">
                  {SPEEDS_KN.map((s) => (
                    <button key={s} onClick={() => setSpeedKn(s)}
                      className="px-3 py-1 rounded-md text-[12px] font-semibold transition-colors"
                      style={{ background: speedKn === s ? "#1f7a8c" : "transparent", color: speedKn === s ? "white" : "rgba(255,255,255,0.6)" }}>
                      {s} kn
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trip economics — fuel vs. real catch-yield history near this zone */}
            <div className="mt-3 w-full max-w-xs bg-white/8 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] uppercase tracking-wider text-white/50" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{t("econ.title")}</span>
                <span className="text-[9.5px] text-white/35">{t("econ.indicative")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[14px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {fuelCostInr != null ? `₹${fuelCostInr.toLocaleString("en-IN")}` : "—"}
                  </div>
                  <div className="text-[9px] text-white/45 uppercase tracking-wider mt-0.5">{t("econ.fuelCost")}</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {catchValueInr != null ? `₹${catchValueInr.toLocaleString("en-IN")}` : "—"}
                  </div>
                  <div className="text-[9px] text-white/45 uppercase tracking-wider mt-0.5">{t("econ.catchValue")}</div>
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: netInr == null ? "white" : netInr >= 0 ? "#8fe0b0" : "#e8a49a", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {netInr != null ? `${netInr >= 0 ? "+" : ""}₹${netInr.toLocaleString("en-IN")}` : "—"}
                  </div>
                  <div className="text-[9px] text-white/45 uppercase tracking-wider mt-0.5">{t("econ.net")}</div>
                </div>
              </div>
              {(!zoneYield || zoneYield.count === 0) && (
                <div className="text-[10.5px] text-white/40 mt-2.5 text-center">{t("econ.noHistory")}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-6 text-center">
        <div className="inline-flex items-center gap-2 text-[11px] text-white/45" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <i className="ph ph-wifi-slash text-[13px]" /> {t("nav.offline")}
          {pos && <span>· ±{Math.round(pos.acc)}m</span>}
        </div>
      </div>
    </div>,
    document.body
  );
}
