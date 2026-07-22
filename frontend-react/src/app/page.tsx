"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { fetcher, apiPost, apiGet } from "@/lib/api";
import { sfzFoliumColor } from "@/lib/colors";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";
import { haversineKm } from "@/lib/geo";
import ZoneNavigator, { type NavTarget } from "@/components/fisher/ZoneNavigator";
import TripPanel from "@/components/fisher/TripPanel";
import BoundaryAlertsToggle from "@/components/fisher/BoundaryAlertsToggle";
import { isNativeApp } from "@/lib/native";
import ComplianceCard from "@/components/fisher/ComplianceCard";
import FisherTour from "@/components/fisher/FisherTour";
import { usePersona } from "@/lib/persona";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import { SPECIES_OPTIONS, LANDING_SITES } from "@/lib/constants";
import FishingCalendar from "@/components/ui/FishingCalendar";
import CatchPhotoScan from "@/components/ui/CatchPhotoScan";
import { refreshLedger } from "@/lib/ledger";
import { computeZoneYield, estimateFuelCostInr, priceForSpecies } from "@/lib/economics";
import type { SFZCurrentResponse, MHIStatusResponse, ChainSummaryResponse, CatchTraceResponse, CatchRecord } from "@/types/api";

const PORTS: Record<string, { lat: number; lon: number; region: string; coast: string }> = {
  "Veraval, Gujarat":       { lat: 20.9, lon: 70.3, region: "GUJARAT", coast: "Arabian Sea" },
  "Kochi, Kerala":          { lat: 9.97, lon: 76.26, region: "KERALA", coast: "Arabian Sea" },
  "Chennai, Tamil Nadu":    { lat: 13.08, lon: 80.27, region: "TAMILNADU", coast: "Bay of Bengal" },
  "Visakhapatnam, AP":      { lat: 17.69, lon: 83.22, region: "BENGAL", coast: "Bay of Bengal" },
  "Mangalore, Karnataka":   { lat: 12.87, lon: 74.88, region: "KERALA", coast: "Arabian Sea" },
};

type Verdict = "GO" | "CAUTION" | "AVOID";
const VERDICT_STYLE: Record<Verdict, { color: string; bg: string; border: string; icon: string }> = {
  GO:      { color: "#2f6f4c", bg: "#eaf3ef", border: "#cfe6dd", icon: "ph-fill ph-check-circle" },
  CAUTION: { color: "#8f6516", bg: "#fbf2e4", border: "#efe2cc", icon: "ph-fill ph-warning" },
  AVOID:   { color: "#9d3c29", bg: "#f6e6e1", border: "#e8cabf", icon: "ph-fill ph-x-circle" },
};

// Sunset time from latitude + longitude + day of year (simplified solar
// equation, IST). offsetHours lets callers subtract a safety buffer.
function sunsetDate(lat: number, lon: number, offsetHours = 0): Date {
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const decl = -23.45 * Math.cos(2 * Math.PI * (doy + 10) / 365) * Math.PI / 180;
  const ha = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(decl)) * 180 / Math.PI;
  const sunsetHour = 12 + ha / 15 + 5.5 - lon / 15 + offsetHours; // 5.5 = IST
  const d = new Date();
  d.setHours(Math.floor(sunsetHour), Math.round((sunsetHour - Math.floor(sunsetHour)) * 60), 0, 0);
  return d;
}
const fmtClock = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function FisherView() {
  const [port, setPort] = useState("Veraval, Gujarat");
  const portInfo = PORTS[port];
  const { toast } = useToast();
  const { t } = useI18n();
  const portCity = port.split(",")[0];
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);

  // First-run capability preview — shown once when a fisher first arrives, so
  // they see what the app does instead of hunting through it. Reopenable via the
  // "?" in the header.
  const { persona, ready: personaReady } = usePersona();
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (!personaReady) return;
    if (persona === "fisher" && !localStorage.getItem("oceanmind_fisher_tour_seen")) {
      setShowTour(true);
    }
  }, [personaReady, persona]);
  function closeTour() {
    setShowTour(false);
    localStorage.setItem("oceanmind_fisher_tour_seen", "1");
  }

  // Persist port choice
  useEffect(() => {
    const saved = localStorage.getItem("oceanmind_port");
    if (saved && PORTS[saved]) setPort(saved);
  }, []);
  function selectPort(p: string) {
    setPort(p);
    localStorage.setItem("oceanmind_port", p);
  }

  // Real device location — works identically on desktop browsers and mobile
  // (same Geolocation API), overriding the port dropdown with the fisher's
  // actual GPS position when they opt in.
  const [geo, setGeo] = useState<{ lat: number; lon: number; acc: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoError(t("fisher.gpsUnsupported"));
      return;
    }
    setGeoStatus("locating");
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy });
        setGeoStatus("idle");
        localStorage.setItem("oceanmind_use_geo", "1");
      },
      () => {
        setGeoStatus("error");
        setGeoError(t("fisher.gpsDenied"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }
  function switchToPort() {
    setGeo(null);
    setGeoStatus("idle");
    setGeoError(null);
    localStorage.removeItem("oceanmind_use_geo");
  }
  // Re-request on load if the fisher previously opted in (never persist stale coords).
  const geoAutoTried = useRef(false);
  useEffect(() => {
    if (geoAutoTried.current) return;
    geoAutoTried.current = true;
    if (localStorage.getItem("oceanmind_use_geo") === "1") useMyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nearest known port to the real GPS fix — used only to label the region/
  // landing-site code, never to override the actual coordinates.
  const nearestPortName = useMemo(() => {
    if (!geo) return port;
    let best = port, bestDist = Infinity;
    for (const [name, info] of Object.entries(PORTS)) {
      const d = haversineKm(geo.lat, geo.lon, info.lat, info.lon);
      if (d < bestDist) { bestDist = d; best = name; }
    }
    return best;
  }, [geo, port]);
  const nearestPortDistKm = geo ? haversineKm(geo.lat, geo.lon, PORTS[nearestPortName].lat, PORTS[nearestPortName].lon) : 0;

  // Effective position for every calculation below: the fisher's real GPS fix
  // when opted in, otherwise the selected port.
  const loc = geo ? { lat: geo.lat, lon: geo.lon } : { lat: portInfo.lat, lon: portInfo.lon };
  const displayCity = geo ? t("fisher.myLocation") : portCity;
  const landingSiteCode = geo ? LANDING_SITES[nearestPortName] : LANDING_SITES[port];

  // Data
  const { data: sfz } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", fetcher, { refreshInterval: 60000 });
  const { data: mhi } = useSWR<MHIStatusResponse>("/api/v1/mhi/status", fetcher);
  const { data: chain } = useSWR<ChainSummaryResponse>("/api/v1/trace/chain-summary", fetcher, { refreshInterval: 10000 });
  // Full ledger (all landing sites) — used to compute real zone-yield history from logged catches.
  const { data: allCatchesRes } = useSWR<{ records: CatchRecord[] }>("/api/v1/trace/history", fetcher, { refreshInterval: 30000 });
  const allCatches = allCatchesRes?.records ?? [];

  // Filter to nearby zones (within ~200km of port)
  const nearbyFeatures = (sfz?.geojson.features ?? []).filter((f) => {
    const [lng, lat] = f.geometry.coordinates;
    return haversineKm(lat, lng, loc.lat, loc.lon) < 200;
  });

  const nearbyGreen = nearbyFeatures.filter((f) => f.properties.ecological_class === "GREEN").length;
  const nearbyAmber = nearbyFeatures.filter((f) => f.properties.ecological_class === "AMBER").length;
  const nearbyRed = nearbyFeatures.filter((f) => f.properties.ecological_class === "RED").length;

  // Nearby MHI alerts
  const nearbyAlerts = (mhi?.grid_cells ?? []).filter((c) =>
    c.alert && haversineKm(c.latitude, c.longitude, loc.lat, loc.lon) < 200
  ).length;

  // Offshore coordinates for weather API (port coords are on land, shift ~30km into ocean)
  const OFFSHORE: Record<string, { lat: number; lon: number }> = {
    "Veraval, Gujarat":     { lat: 20.0, lon: 69.0 },
    "Kochi, Kerala":        { lat: 9.8, lon: 75.5 },
    "Chennai, Tamil Nadu":  { lat: 13.0, lon: 81.0 },
    "Visakhapatnam, AP":    { lat: 17.5, lon: 84.0 },
    "Mangalore, Karnataka": { lat: 12.5, lon: 74.3 },
  };
  const offshore = OFFSHORE[port] ?? { lat: portInfo.lat, lon: portInfo.lon - 0.5 };
  // A real GPS fix is already a true position (no on-land shift needed).
  const offshoreLoc = geo ? loc : offshore;

  // Real weather + GO/CAUTION/AVOID verdict from Open-Meteo via fishing advisory API
  const [weather, setWeather] = useState<{ sst: string; sstNum: number | null; wind: string; windDir: string; wave: string; vis: string; highTide: string; lowTide: string } | null>(null);
  const [verdict, setVerdict] = useState<{ rec: Verdict; score: number } | null>(null);
  useEffect(() => {
    setWeather(null);
    setVerdict(null);
    apiPost<{ advisory: {
      current: { sst_c: number | null; wave_height_m: number | null; wind_speed_kmh: number | null };
      tides?: { high_tide?: { time: string; height_m: number } | null; low_tide?: { time: string; height_m: number } | null };
      recommendation?: Verdict; fishing_score?: number;
    } }>("/api/v1/fishing/advisory", {
      lat: offshoreLoc.lat, lon: offshoreLoc.lon, site_name: displayCity,
    }).then(res => {
      const c = res.advisory.current;
      const tides = res.advisory.tides;
      const windKmh = c.wind_speed_kmh ?? 0;
      const windKn = (windKmh * 0.54).toFixed(0);
      const sstVal = c.sst_c;
      const visGood = (c.wave_height_m ?? 0) < 1.5;
      setWeather({
        sst: sstVal != null ? `${sstVal.toFixed(1)}°` : "—",
        sstNum: sstVal,
        wind: `${windKn} kn`,
        windDir: windKmh > 15 ? "SW" : "NE",
        wave: c.wave_height_m != null ? `${c.wave_height_m} m` : "—",
        vis: visGood ? t("seasky.good") : t("seasky.moderate"),
        highTide: tides?.high_tide?.time ?? "—",
        lowTide: tides?.low_tide?.time ?? "—",
      });
      if (res.advisory.recommendation && res.advisory.fishing_score != null) {
        setVerdict({ rec: res.advisory.recommendation, score: Math.round(res.advisory.fishing_score) });
      }
    }).catch(() => {
      setWeather({ sst: "—", sstNum: null, wind: "—", windDir: "—", wave: "—", vis: "—", highTide: "—", lowTide: "—" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [port, geo?.lat, geo?.lon]);

  // Sunset + return-home time for the current position (shared helper above).
  // Computed after mount only: these depend on the wall clock and the runtime
  // locale, which differ between the server render and the browser and would
  // otherwise cause a hydration text mismatch (React #418).
  // The Date itself is only passed to TripPanel and read inside a click
  // handler, never rendered as text — so it stays safe to compute here.
  const returnByDate = sunsetDate(loc.lat, loc.lon, -0.5); // 30-min safety buffer
  const [sunTimes, setSunTimes] = useState<{ sunset: string; returnBy: string }>({ sunset: "—", returnBy: "—" });
  useEffect(() => {
    setSunTimes({
      sunset: fmtClock(sunsetDate(loc.lat, loc.lon)),
      returnBy: fmtClock(sunsetDate(loc.lat, loc.lon, -0.5)),
    });
  }, [loc.lat, loc.lon]);
  const sunsetTime = sunTimes.sunset;
  const returnByTime = sunTimes.returnBy;


  // Map points — only nearby. GREEN dots are tappable: tap one to navigate
  // straight to that exact zone with the sea compass.
  const mapPoints: MarkerPoint[] = nearbyFeatures.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const zone = f.properties.ecological_class;
    const label = zone === "GREEN" ? t("map.safeToFish") : zone === "RED" ? t("map.avoidArea") : t("map.fishCaution");
    if (zone === "GREEN") {
      return {
        lat, lng, color: sfzFoliumColor(zone), radius: 8,
        tooltip: `${label} · ${t("nav.tapToGo")}`,
        onClick: () => setNavTarget({ lat, lon: lng, name: t("nav.zoneName"), zoneClass: "GREEN" }),
      };
    }
    return {
      lat, lng, color: sfzFoliumColor(zone), radius: 8,
      tooltip: label,
      popup: `<b>${label}</b><br/>${(f.properties.bycatch_risk_score * 100).toFixed(0)}%`,
    };
  });

  // Geofence alert — warn if the fisher's live GPS position gets close to a
  // RED (avoid) zone. Fully client-side: no server push, just the browser's
  // own Geolocation + Notification APIs, so it works with no backend changes.
  const redZonePoints = useMemo(() => {
    return (sfz?.geojson.features ?? [])
      .filter((f) => {
        const [lng, lat] = f.geometry.coordinates;
        return f.properties.ecological_class === "RED" && haversineKm(lat, lng, loc.lat, loc.lon) < 200;
      })
      .map((f) => ({ lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }));
  }, [sfz, loc.lat, loc.lon]);

  // Nearest GREEN (recommended) zone to the fisher's position — the navigation target.
  const nearestGreen = useMemo(() => {
    let best: { lat: number; lon: number; dist: number } | null = null;
    for (const f of sfz?.geojson.features ?? []) {
      if (f.properties.ecological_class !== "GREEN") continue;
      const [lng, lat] = f.geometry.coordinates;
      const dist = haversineKm(loc.lat, loc.lon, lat, lng);
      if (!best || dist < best.dist) best = { lat, lon: lng, dist };
    }
    return best;
  }, [sfz, loc.lat, loc.lon]);

  // Real yield history near the recommended zone, built from the fleet's own
  // logged catches (the ledger) — not a model prediction. Feeds the trip
  // economics estimate below and the live compass overlay.
  const nearestGreenYield = useMemo(
    () => (nearestGreen ? computeZoneYield(allCatches, { lat: nearestGreen.lat, lon: nearestGreen.lon }) : null),
    [allCatches, nearestGreen]
  );
  const nearestGreenFuelCost = nearestGreen ? estimateFuelCostInr(nearestGreen.dist, 8) : null;
  const nearestGreenCatchValue = nearestGreenYield && nearestGreenYield.count > 0
    ? Math.round(nearestGreenYield.avgKg * priceForSpecies(nearestGreenYield.topSpecies))
    : null;
  const nearestGreenNet = nearestGreenCatchValue != null && nearestGreenFuelCost != null
    ? nearestGreenCatchValue - nearestGreenFuelCost
    : null;

  // Same yield lookup for whatever zone the fisher is actively navigating to
  // (tapped a map dot, or the button above) — passed into the compass overlay.
  const navZoneYield = useMemo(
    () => (navTarget ? computeZoneYield(allCatches, { lat: navTarget.lat, lon: navTarget.lon }) : null),
    [allCatches, navTarget]
  );

  const insideRedZoneRef = useRef(false);
  useEffect(() => {
    if (!("geolocation" in navigator) || redZonePoints.length === 0) return;
    // In the native app the background boundary watch (BoundaryAlertsToggle)
    // covers this — skip the web watcher so the fisher isn't alerted twice.
    if (isNativeApp()) return;

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const GEOFENCE_RADIUS_KM = 8;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearestKm = redZonePoints.reduce(
          (min, z) => Math.min(min, haversineKm(latitude, longitude, z.lat, z.lon)),
          Infinity
        );
        const isInside = nearestKm < GEOFENCE_RADIUS_KM;

        if (isInside && !insideRedZoneRef.current) {
          const msg = t("geofence.warning", { km: nearestKm.toFixed(1) });
          toast(msg, "error");
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("OceanMind", { body: msg });
          }
        }
        insideRedZoneRef.current = isInside;
      },
      () => {}, // silently ignore denial/failure — geofencing is a bonus, not a blocker
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [redZonePoints, toast, t]);

  // Catch form
  const [showCatch, setShowCatch] = useState(false);
  const [catchForm, setCatchForm] = useState({
    species: Object.keys(SPECIES_OPTIONS)[0],
    quantity_kg: 100,
  });
  const [logging, setLogging] = useState(false);
  const [catchScore, setCatchScore] = useState<{ score: number; rating: string; flag: string | null; tips: string[]; species_status: { label: string } } | null>(null);

  // Local history
  const [localHistory, setLocalHistory] = useState<CatchRecord[]>([]);
  useEffect(() => {
    if (landingSiteCode) {
      apiGet<{ records: CatchRecord[] }>("/api/v1/trace/history", { landing_site: landingSiteCode })
        .then((res) => setLocalHistory(res.records))
        .catch(() => {});
    }
  }, [landingSiteCode, chain?.total_blocks]);

  async function logCatch(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    try {
      const speciesName = catchForm.species.split(" (")[0];
      const res = await apiPost<CatchTraceResponse>("/api/v1/trace/catch", {
        species_aphia_id: SPECIES_OPTIONS[catchForm.species],
        species_name: speciesName,
        quantity_kg: catchForm.quantity_kg,
        latitude: loc.lat, longitude: loc.lon,
        landing_site_id: landingSiteCode,
      });
      // Score the catch's Blue Score (sustainability + legality) inline
      let scoreMsg = "";
      try {
        const score = await apiPost<{ score: number; rating: string; flag: string | null; tips: string[]; species_status: { label: string } }>(
          "/api/v1/footprint/score",
          { species_name: speciesName, latitude: loc.lat, longitude: loc.lon, quantity_kg: catchForm.quantity_kg }
        );
        setCatchScore(score);
        scoreMsg = ` · ${t("fp.blueScoreShort")} ${score.score}`;
      } catch { /* scoring is a bonus — never block a log */ }
      await refreshLedger(); // feed and chain summary update immediately
      toast(t("form.recorded", { n: res.block_number }) + scoreMsg, "success");
      setShowCatch(false);
    } finally { setLogging(false); }
  }

  const [timeStr, setTimeStr] = useState("--:--");
  useEffect(() => {
    setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const tm = setInterval(() => setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 30000);
    return () => clearInterval(tm);
  }, []);

  return (
    <div className="animate-page-enter max-w-6xl mx-auto">

      {/* Header: port selector + language toggle */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text" style={{ fontFamily: "'Newsreader', serif" }}>{t("fisher.title")}</h1>
            <button onClick={() => setShowTour(true)} aria-label={t("tour.reopen")} title={t("tour.reopen")}
              className="flex-none w-[22px] h-[22px] rounded-full border border-card-border text-text-muted hover:text-accent hover:border-accent/40 flex items-center justify-center transition-colors">
              <i className="ph ph-question text-[12px]" />
            </button>
          </div>
          <p className="text-sm text-text-faint">{t("fisher.subtitle")}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {geo ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/25 rounded-lg px-3 py-2">
                <i className="ph-fill ph-crosshair text-accent" style={{ fontSize: 14 }} />
                <span className="text-sm font-semibold text-accent">{t("fisher.myLocation")}</span>
              </div>
              <div className="text-[10px] text-text-faint text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {t("fisher.gpsAccuracy", { m: Math.round(geo.acc) })}
                {nearestPortDistKm > 0.5 && ` · ${t("fisher.nearPort", { km: nearestPortDistKm.toFixed(0), port: nearestPortName.split(",")[0] })}`}
              </div>
              <button onClick={switchToPort} className="text-[11px] text-text-muted hover:text-accent transition-colors underline decoration-dotted underline-offset-2">
                {t("fisher.switchToPort")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1.5">
              <select
                value={port}
                onChange={(e) => selectPort(e.target.value)}
                aria-label={t("fisher.yourPort")}
                className="bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text
                           focus:outline-none focus:border-accent/50 min-w-[170px]"
              >
                {Object.keys(PORTS).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={useMyLocation} disabled={geoStatus === "locating"}
                className="flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent-dark transition-colors disabled:opacity-60">
                <i className={`ph ${geoStatus === "locating" ? "ph-circle-notch animate-spin" : "ph-crosshair"}`} style={{ fontSize: 13 }} />
                {geoStatus === "locating" ? t("fisher.locating") : t("fisher.useLocation")}
              </button>
              {geoStatus === "error" && geoError && (
                <span className="text-[10.5px] text-[#c25a44] max-w-[210px] text-right leading-snug">{geoError}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's verdict — the single most important answer for a fisher */}
      {(() => {
        const v = verdict?.rec;
        const s = v ? VERDICT_STYLE[v] : null;
        return (
          <div className="rounded-2xl border p-4 mb-4 flex items-center gap-4"
               style={{ background: s?.bg ?? "#faf7f0", borderColor: s?.border ?? "#ece5d6" }}>
            {v && s ? (
              <>
                <i className={`${s.icon} text-[40px]`} style={{ color: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-black leading-none" style={{ color: s.color, fontFamily: "'Newsreader', serif" }}>
                    {t(`verdict.${v}`)}
                  </div>
                  <div className="text-[13px] mt-1" style={{ color: s.color }}>{t(`verdict.${v}.desc`)}</div>
                </div>
                <div className="text-right flex-none">
                  <div className="text-3xl font-black" style={{ color: s.color, fontFamily: "'IBM Plex Mono', monospace" }}>{verdict?.score}</div>
                  <div className="text-[9px] uppercase tracking-wider" style={{ color: s.color, opacity: 0.7 }}>{t("verdict.score")}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-text-faint text-sm py-1">
                <i className="ph ph-circle-notch animate-spin text-[18px]" />
                {t("verdict.loading")}
              </div>
            )}
          </div>
        );
      })()}

      {/* Can I fish here today? — seasonal ban + protected-area check */}
      <ComplianceCard lat={offshoreLoc.lat} lon={offshoreLoc.lon} />

      {/* Trip safety mode — breadcrumb tracking + return-home watchdog */}
      <TripPanel home={{ lat: loc.lat, lon: loc.lon }} homeName={displayCity} returnBy={returnByDate} />

      {/* Native app only: no-go-zone warnings with the screen off */}
      <BoundaryAlertsToggle zones={redZonePoints} />

      {/* Navigate to the recommended zone — turns the advisory into action */}
      {nearestGreen && (
        <button
          onClick={() => setNavTarget({ lat: nearestGreen.lat, lon: nearestGreen.lon, name: t("nav.zoneName"), zoneClass: "GREEN" })}
          className="w-full mb-4 flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-dark text-white rounded-2xl py-3.5 font-semibold border border-accent/20 transition-all hover:-translate-y-0.5"
        >
          <i className="ph-fill ph-compass text-[20px]" />
          {t("nav.cta")}
          <span className="text-white/70 font-normal">· {nearestGreen.dist.toFixed(0)} km</span>
        </button>
      )}

      {/* Zone yield (from the real catch ledger) + trip economics — turns the
          navigation button above into an actual "is this trip worth it" answer. */}
      {nearestGreen && (
        <div className="bg-white border border-card-border rounded-2xl p-4 mb-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 8px 22px rgba(23,48,57,0.05)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-text">{t("econ.title")}</h3>
            <span className="text-[10px] text-text-faint">{t("econ.indicative")}</span>
          </div>
          <p className="text-[12.5px] text-text-secondary mb-3">
            {nearestGreenYield && nearestGreenYield.count > 0
              ? t("econ.nearbyCatches", { n: nearestGreenYield.count, d: nearestGreenYield.sinceDays, kg: nearestGreenYield.avgKg, species: nearestGreenYield.topSpecies ?? "—" })
              : t("econ.noHistory")}
          </p>
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-lg bg-card-hover p-2.5">
              <div className="text-[15px] font-bold text-text" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                ₹{nearestGreenFuelCost?.toLocaleString("en-IN")}
              </div>
              <div className="text-[9.5px] text-text-muted uppercase tracking-wider mt-0.5">{t("econ.fuelCost")}</div>
            </div>
            <div className="rounded-lg bg-card-hover p-2.5">
              <div className="text-[15px] font-bold text-text" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {nearestGreenCatchValue != null ? `₹${nearestGreenCatchValue.toLocaleString("en-IN")}` : "—"}
              </div>
              <div className="text-[9.5px] text-text-muted uppercase tracking-wider mt-0.5">{t("econ.catchValue")}</div>
            </div>
            <div className={`rounded-lg p-2.5 ${nearestGreenNet == null ? "bg-card-hover" : nearestGreenNet >= 0 ? "bg-[#eaf3ef]" : "bg-[#f6e6e1]"}`}>
              <div className="text-[15px] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: nearestGreenNet == null ? undefined : nearestGreenNet >= 0 ? "#2f6f4c" : "#9d3c29" }}>
                {nearestGreenNet != null ? `${nearestGreenNet >= 0 ? "+" : ""}₹${nearestGreenNet.toLocaleString("en-IN")}` : "—"}
              </div>
              <div className="text-[9.5px] uppercase tracking-wider mt-0.5" style={{ color: nearestGreenNet == null ? undefined : (nearestGreenNet >= 0 ? "#2f6f4c" : "#9d3c29"), opacity: 0.8 }}>{t("econ.net")}</div>
            </div>
          </div>
        </div>
      )}

      {/* Contextual banner (stress / safe zones) — the monsoon ban is now shown
          authoritatively by the compliance card above. */}
      {nearbyAlerts > 0 ? (
        <div className="bg-[#d49a2e]/10 border border-[#d49a2e]/25 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#d49a2e] animate-pulse" />
            <span className="text-sm font-semibold text-[#d49a2e]">{t("banner.alerts", { n: nearbyAlerts, port: displayCity })}</span>
          </div>
        </div>
      ) : nearbyGreen > 0 ? (
        <div className="bg-[#3a8c5f]/10 border border-[#3a8c5f]/25 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3a8c5f]" />
            <span className="text-sm font-semibold text-[#3a8c5f]">{t("banner.safeZones", { n: nearbyGreen, port: displayCity })}</span>
            <span className="ml-auto text-xs text-text-faint">{timeStr}</span>
          </div>
        </div>
      ) : null}

      {/* Stats row — ecological zone quality (weekly SFZ model), distinct from
          today's live sea-safety verdict above: a zone can be a good habitat
          (low bycatch risk) even on a day the weather says AVOID. */}
      <div className="flex items-baseline justify-between mb-2 mt-1">
        <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-text-muted">{t("stat.zonesHeader")}</span>
        <span className="text-[0.62rem] text-text-faint">{t("stat.zonesSubhead")}</span>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-[#3a8c5f]/8 border border-[#3a8c5f]/15 rounded-xl p-3.5 text-center transition-all hover:border-[#3a8c5f]/30">
          <div className="text-2xl font-bold text-[#3a8c5f]">{nearbyGreen}</div>
          <div className="text-[0.65rem] text-[#3a8c5f]/60 mt-0.5 uppercase tracking-wider">{t("stat.safe")}</div>
        </div>
        <div className="bg-[#d49a2e]/8 border border-[#d49a2e]/15 rounded-xl p-3.5 text-center transition-all hover:border-[#d49a2e]/30">
          <div className="text-2xl font-bold text-[#d49a2e]">{nearbyAmber}</div>
          <div className="text-[0.65rem] text-[#d49a2e]/60 mt-0.5 uppercase tracking-wider">{t("stat.caution")}</div>
        </div>
        <div className="bg-[#c25a44]/8 border border-[#c25a44]/15 rounded-xl p-3.5 text-center transition-all hover:border-[#c25a44]/30">
          <div className="text-2xl font-bold text-[#c25a44]">{nearbyRed}</div>
          <div className="text-[0.65rem] text-[#c25a44]/60 mt-0.5 uppercase tracking-wider">{t("stat.avoid")}</div>
        </div>
        <div className="bg-card-hover border border-card-border rounded-xl p-3.5 text-center transition-all hover:border-accent/15">
          <div className="text-2xl font-bold text-text">{weather?.sstNum != null ? weather.sstNum.toFixed(1) : "—"}<span className="text-sm text-text-faint">°C</span></div>
          <div className="text-[0.65rem] text-text-faint mt-0.5 uppercase tracking-wider">{t("stat.seaTemp")}</div>
        </div>
      </div>

      {/* Map + Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 relative">
          <div className="animate-data-enter relative">
            <MapContainer
              height="400px"
              center={[loc.lat, loc.lon]}
              zoom={7}
              points={geo ? [{ lat: geo.lat, lng: geo.lon, color: "#1f7a8c", radius: 9, fillOpacity: 0.95, tooltip: t("fisher.myLocation") }, ...mapPoints] : mapPoints}
            />
            <MapLegend title={t("map.zones")} items={[
              { color: "#3a8c5f", label: t("map.recommended") },
              { color: "#d49a2e", label: t("map.caution") },
              { color: "#c25a44", label: t("map.avoid") },
            ]} />
          </div>
        </div>

        <div className="space-y-3">
          {/* Sea & Sky */}
          <div className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 8px 22px rgba(23,48,57,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="m-0 text-[15px] font-semibold text-text" style={{ fontFamily: "'Newsreader', serif" }}>{t("seasky.title")}</h3>
              <span className="text-[10px] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Open-Meteo · live</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { icon: "ph ph-wind", value: weather?.wind ?? "—", sub: weather?.windDir ?? "—" },
                { icon: "ph ph-waves", value: weather?.wave ?? "—", sub: t("seasky.swell") },
                { icon: "ph ph-thermometer-simple", value: weather?.sst ?? "—", sub: t("seasky.water") },
                { icon: "ph ph-eye", value: weather?.vis ?? "—", sub: t("seasky.vis") },
              ].map((w, i) => (
                <div key={i}>
                  <i className={`${w.icon} text-[18px] text-accent`} />
                  <div className="text-[15px] font-semibold text-text mt-1" style={{ fontFamily: "'Newsreader', serif" }}>{w.value}</div>
                  <div className="text-[9px] text-text-muted">{w.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0ebdf] text-[12px] text-text-secondary">
              <span className="flex items-center gap-1"><i className="ph ph-arrow-up text-[12px] text-accent" /> {t("tide.high")} {weather?.highTide ?? "—"}</span>
              <span className="flex items-center gap-1"><i className="ph ph-arrow-down text-[12px] text-accent" /> {t("tide.low")} {weather?.lowTide ?? "—"}</span>
            </div>
          </div>

          {/* Safety advisory */}
          <div className="flex items-center gap-3 bg-[#fbf2e4] border border-[#efe2cc] rounded-2xl px-4 py-3.5">
            <div className="w-10 h-10 flex-none rounded-xl bg-[rgba(217,139,74,0.16)] text-[#c0772f] flex items-center justify-center">
              <i className="ph-fill ph-sun-dim text-[22px]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text">{t("safety.headBack", { time: returnByTime })}</div>
              <div className="text-[11.5px] text-[#8a7a5e] mt-0.5">{t("safety.sunset", { time: sunsetTime })}</div>
            </div>
          </div>

          {/* Recent catches at this port */}
          <div className="bg-white border border-card-border rounded-2xl p-4">
            <h3 className="text-[0.65rem] uppercase tracking-wider text-text-faint font-semibold mb-3">
              {t("catches.title", { port: displayCity })}
            </h3>
            {localHistory.length === 0 ? (
              <p className="text-xs text-text-faint py-2">{t("catches.empty")}</p>
            ) : (
              <div className="space-y-1">
                {localHistory.slice(0, 5).map((r) => (
                  <div key={r.transaction_id} className="flex items-center gap-2.5 py-1.5">
                    <span className="w-6 h-6 flex-none rounded-md bg-zone-green-bg text-accent flex items-center justify-center">
                      <i className="ph ph-fish-simple text-[13px]" />
                    </span>
                    <span className="flex-1 text-[12.5px] text-text-secondary">{r.species_name}</span>
                    <span className="text-[12px] text-text font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{r.quantity_kg} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div className="bg-white border border-card-border rounded-2xl p-4">
            <h3 className="text-[0.65rem] uppercase tracking-wider text-text-faint font-semibold mb-3">{t("explore.title")}</h3>
            <div className="space-y-1">
              {[
                { href: "/fishing-advisory", icon: "ph ph-target", label: t("explore.advisory") },
                { href: "/migration", icon: "ph ph-fish", label: t("explore.migration") },
                { href: "/biodiversity", icon: "ph ph-microscope", label: t("explore.species", { port: displayCity }) },
                { href: "/digital-twin", icon: "ph ph-globe-hemisphere-east", label: t("explore.twin") },
              ].map((link) => (
                <a key={link.href} href={link.href} className="flex items-center gap-3 py-2 text-[13px] text-text-secondary hover:text-accent transition-colors">
                  <i className={`${link.icon} text-[15px] text-accent`} />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button onClick={() => setShowCatch(!showCatch)}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-xl py-3 text-sm font-semibold border border-accent/20 transition-all hover:-translate-y-0.5">
          {t("action.logCatch")}
        </button>
        <a href="/biodiversity"
          className="flex items-center justify-center gap-2 bg-white border border-[#d8cfbc] text-[#2a6f7c] rounded-xl py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-accent/30">
          {t("action.scan")}
        </a>
        <a href="/voice"
          className="flex items-center justify-center gap-2 bg-white border border-[#d8cfbc] text-[#2a6f7c] rounded-xl py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-accent/30">
          {t("action.ask")}
        </a>
        <a href="/alerts"
          className="flex items-center justify-center gap-2 bg-white border border-[#d8cfbc] text-[#2a6f7c] rounded-xl py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-accent/30">
          {t("action.alerts")}
        </a>
      </div>

      {/* Catch form */}
      {showCatch && (
        <div className="mb-4 animate-data-enter bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">{t("form.title", { port: displayCity })}</h3>
            <button onClick={() => setShowCatch(false)} className="text-text-faint hover:text-text-muted text-lg">&times;</button>
          </div>
          {/* Photo first — naming a species from a picture beats a dropdown at sea */}
          <div className="pb-4 mb-4 border-b border-[#f0ebdf]">
            <CatchPhotoScan
              lat={loc.lat}
              lon={loc.lon}
              onDetect={(d) => {
                const match = Object.keys(SPECIES_OPTIONS).find((s) =>
                  s.toLowerCase().startsWith(d.common.toLowerCase().slice(0, 6))
                );
                if (match) setCatchForm((f) => ({ ...f, species: match }));
              }}
            />
          </div>
          <form onSubmit={logCatch} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <label className="block">
              <span className="text-xs text-text-muted">{t("form.species")}</span>
              <select value={catchForm.species} onChange={(e) => setCatchForm({ ...catchForm, species: e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2.5 text-sm text-text">
                {Object.keys(SPECIES_OPTIONS).map((s) => <option key={s} value={s}>{s.split(" (")[0]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">{t("form.quantity")}</span>
              <input type="number" value={catchForm.quantity_kg}
                onChange={(e) => setCatchForm({ ...catchForm, quantity_kg: +e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2.5 text-sm text-text" />
            </label>
            <button type="submit" disabled={logging}
              className="bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
              {logging ? t("form.logging") : t("form.record")}
            </button>
          </form>
        </div>
      )}

      {/* Inline Blue Score after logging a catch */}
      {catchScore && (() => {
        const c = catchScore.score >= 70 ? "#2f6f4c" : catchScore.score >= 40 ? "#8f6516" : "#9d3c29";
        const bg = catchScore.score >= 70 ? "#eaf3ef" : catchScore.score >= 40 ? "#fbf2e4" : "#f6e6e1";
        const bd = catchScore.score >= 70 ? "#cfe6dd" : catchScore.score >= 40 ? "#efe2cc" : "#e8cabf";
        return (
          <div className="mb-4 animate-data-enter rounded-2xl border p-4 flex items-center gap-4" style={{ background: bg, borderColor: bd }}>
            <div className="flex-none text-center">
              <div className="text-[34px] font-black leading-none" style={{ color: c, fontFamily: "'IBM Plex Mono', monospace" }}>{catchScore.score}</div>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: c, opacity: 0.7 }}>{t("fp.blueScoreShort")}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold" style={{ color: c }}>
                {catchScore.rating === "SUSTAINABLE" ? t("fp.sustainable") : catchScore.rating === "MODERATE" ? t("fp.moderate") : t("fp.highImpact")}
                <span className="font-normal opacity-70"> · {catchScore.species_status.label}</span>
              </div>
              <div className="text-[11.5px] mt-0.5" style={{ color: c }}>{catchScore.flag ?? catchScore.tips[0]}</div>
            </div>
            <button onClick={() => setCatchScore(null)} className="flex-none text-lg leading-none" style={{ color: c }} aria-label="Dismiss">&times;</button>
          </div>
        );
      })()}

      <div className="mb-4">
        <FishingCalendar compact />
      </div>

      <div className="text-center text-[0.6rem] text-text-faint pb-2">
        {t("footer.data")}
      </div>

      {navTarget && <ZoneNavigator target={navTarget} zoneYield={navZoneYield} onClose={() => setNavTarget(null)} />}
      <FisherTour open={showTour} onClose={closeTour} />
    </div>
  );
}
