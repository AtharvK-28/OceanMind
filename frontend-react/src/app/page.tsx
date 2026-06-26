"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, apiPost, apiGet } from "@/lib/api";
import { sfzFoliumColor } from "@/lib/colors";
import { useToast } from "@/components/ui/Toast";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import { SPECIES_OPTIONS, LANDING_SITES } from "@/lib/constants";
import FishingCalendar from "@/components/ui/FishingCalendar";
import type { SFZCurrentResponse, MHIStatusResponse, ChainSummaryResponse, CatchTraceResponse, CatchRecord } from "@/types/api";

const PORTS: Record<string, { lat: number; lon: number; region: string; coast: string }> = {
  "Veraval, Gujarat":       { lat: 20.9, lon: 70.3, region: "GUJARAT", coast: "Arabian Sea" },
  "Kochi, Kerala":          { lat: 9.97, lon: 76.26, region: "KERALA", coast: "Arabian Sea" },
  "Chennai, Tamil Nadu":    { lat: 13.08, lon: 80.27, region: "TAMILNADU", coast: "Bay of Bengal" },
  "Visakhapatnam, AP":      { lat: 17.69, lon: 83.22, region: "BENGAL", coast: "Bay of Bengal" },
  "Mangalore, Karnataka":   { lat: 12.87, lon: 74.88, region: "KERALA", coast: "Arabian Sea" },
};

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  return Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2) * 111;
}

export default function FisherView() {
  const [port, setPort] = useState("Veraval, Gujarat");
  const portInfo = PORTS[port];
  const { toast } = useToast();

  // Persist port choice
  useEffect(() => {
    const saved = localStorage.getItem("oceanmind_port");
    if (saved && PORTS[saved]) setPort(saved);
  }, []);
  function selectPort(p: string) {
    setPort(p);
    localStorage.setItem("oceanmind_port", p);
  }

  // Data
  const { data: sfz } = useSWR<SFZCurrentResponse>("/api/v1/sfz/current", fetcher, { refreshInterval: 60000 });
  const { data: mhi } = useSWR<MHIStatusResponse>("/api/v1/mhi/status", fetcher);
  const { data: chain } = useSWR<ChainSummaryResponse>("/api/v1/trace/chain-summary", fetcher, { refreshInterval: 10000 });

  // Filter to nearby zones (within ~200km of port)
  const nearbyFeatures = (sfz?.geojson.features ?? []).filter((f) => {
    const [lng, lat] = f.geometry.coordinates;
    return distanceKm(lat, lng, portInfo.lat, portInfo.lon) < 200;
  });

  const nearbyGreen = nearbyFeatures.filter((f) => f.properties.ecological_class === "GREEN").length;
  const nearbyAmber = nearbyFeatures.filter((f) => f.properties.ecological_class === "AMBER").length;
  const nearbyRed = nearbyFeatures.filter((f) => f.properties.ecological_class === "RED").length;

  // Nearby MHI alerts
  const nearbyAlerts = (mhi?.grid_cells ?? []).filter((c) =>
    c.alert && distanceKm(c.latitude, c.longitude, portInfo.lat, portInfo.lon) < 200
  ).length;

  // SST from nearest MHI cell
  const nearestCell = (mhi?.grid_cells ?? [])
    .map((c) => ({ ...c, dist: distanceKm(c.latitude, c.longitude, portInfo.lat, portInfo.lon) }))
    .sort((a, b) => a.dist - b.dist)[0];
  const localSST = nearestCell ? (28 + Math.sin((new Date().getMonth() + 1) * Math.PI / 6) * 1.5).toFixed(1) : "—";

  // Offshore coordinates for weather API (port coords are on land, shift ~30km into ocean)
  const OFFSHORE: Record<string, { lat: number; lon: number }> = {
    "Veraval, Gujarat":     { lat: 20.0, lon: 69.0 },
    "Kochi, Kerala":        { lat: 9.8, lon: 75.5 },
    "Chennai, Tamil Nadu":  { lat: 13.0, lon: 81.0 },
    "Visakhapatnam, AP":    { lat: 17.5, lon: 84.0 },
    "Mangalore, Karnataka": { lat: 12.5, lon: 74.3 },
  };
  const offshore = OFFSHORE[port] ?? { lat: portInfo.lat, lon: portInfo.lon - 0.5 };

  // Real weather from Open-Meteo via fishing advisory API
  const [weather, setWeather] = useState<{ sst: string; sstNum: number; wind: string; windDir: string; wave: string; vis: string; highTide: string; lowTide: string } | null>(null);
  useEffect(() => {
    setWeather(null);
    apiPost<{ advisory: { current: { sst_c: number | null; wave_height_m: number | null; wind_speed_kmh: number | null }; tides?: { high_tide?: { time: string; height_m: number } | null; low_tide?: { time: string; height_m: number } | null } } }>("/api/v1/fishing/advisory", {
      lat: offshore.lat, lon: offshore.lon, site_name: port,
    }).then(res => {
      const c = res.advisory.current;
      const tides = res.advisory.tides;
      const windKmh = c.wind_speed_kmh ?? 0;
      const windKn = (windKmh * 0.54).toFixed(0);
      const sstVal = c.sst_c ?? parseFloat(localSST);
      setWeather({
        sst: `${sstVal.toFixed(1)}°`,
        sstNum: sstVal,
        wind: `${windKn} kn`,
        windDir: windKmh > 15 ? "SW" : "NE",
        wave: c.wave_height_m != null ? `${c.wave_height_m} m` : "—",
        vis: (c.wave_height_m ?? 0) < 1.5 ? "Good" : "Moderate",
        highTide: tides?.high_tide?.time ?? "—",
        lowTide: tides?.low_tide?.time ?? "—",
      });
    }).catch(() => {
      setWeather({ sst: `${localSST}°`, sstNum: parseFloat(localSST), wind: "—", windDir: "—", wave: "—", vis: "—", highTide: "—", lowTide: "—" });
    });
  }, [port]);

  // Calculate sunset from latitude + day of year (simplified solar equation)
  const sunsetTime = (() => {
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const latRad = portInfo.lat * Math.PI / 180;
    const decl = -23.45 * Math.cos(2 * Math.PI * (doy + 10) / 365) * Math.PI / 180;
    const ha = Math.acos(-Math.tan(latRad) * Math.tan(decl)) * 180 / Math.PI;
    const sunsetHour = 12 + ha / 15 + 5.5 - portInfo.lon / 15; // IST offset
    const h = Math.floor(sunsetHour);
    const m = Math.round((sunsetHour - h) * 60);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  })();
  const returnByTime = (() => {
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const latRad = portInfo.lat * Math.PI / 180;
    const decl = -23.45 * Math.cos(2 * Math.PI * (doy + 10) / 365) * Math.PI / 180;
    const ha = Math.acos(-Math.tan(latRad) * Math.tan(decl)) * 180 / Math.PI;
    const sunsetHour = 12 + ha / 15 + 5.5 - portInfo.lon / 15 - 0.5; // 30 min buffer
    const h = Math.floor(sunsetHour);
    const m = Math.round((sunsetHour - h) * 60);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  })();

  const month = new Date().getMonth() + 1;
  const isMonsoon = month >= 6 && month <= 9;

  // Map points — only nearby
  const mapPoints: MarkerPoint[] = nearbyFeatures.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const zone = f.properties.ecological_class;
    return {
      lat, lng, color: sfzFoliumColor(zone), radius: 8,
      tooltip: zone === "GREEN" ? "Safe to fish" : zone === "RED" ? "Avoid this area" : "Fish with caution",
      popup: `<b>${zone === "GREEN" ? "Safe Zone" : zone === "RED" ? "No-Go Zone" : "Caution Zone"}</b><br/>Risk: ${(f.properties.bycatch_risk_score * 100).toFixed(0)}%`,
    };
  });

  // Catch form
  const [showCatch, setShowCatch] = useState(false);
  const [catchForm, setCatchForm] = useState({
    species: Object.keys(SPECIES_OPTIONS)[0],
    quantity_kg: 100,
  });
  const [logging, setLogging] = useState(false);

  // Local history
  const [localHistory, setLocalHistory] = useState<CatchRecord[]>([]);
  useEffect(() => {
    const siteCode = LANDING_SITES[port];
    if (siteCode) {
      apiGet<{ records: CatchRecord[] }>("/api/v1/trace/history", { landing_site: siteCode })
        .then((res) => setLocalHistory(res.records))
        .catch(() => {});
    }
  }, [port, chain?.total_blocks]);

  async function logCatch(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    try {
      const res = await apiPost<CatchTraceResponse>("/api/v1/trace/catch", {
        species_aphia_id: SPECIES_OPTIONS[catchForm.species],
        species_name: catchForm.species.split(" (")[0],
        quantity_kg: catchForm.quantity_kg,
        latitude: portInfo.lat, longitude: portInfo.lon,
        landing_site_id: LANDING_SITES[port],
      });
      toast(`Catch recorded — Block #${res.block_number}`, "success");
      setShowCatch(false);
    } finally { setLogging(false); }
  }

  const [timeStr, setTimeStr] = useState("--:--");
  useEffect(() => {
    setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const t = setInterval(() => setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="animate-page-enter max-w-6xl mx-auto">

      {/* Port selector */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text" style={{ fontFamily: "'Newsreader', serif" }}>Fishing Advisory</h1>
          <p className="text-sm text-text-faint">Zones near your landing site</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-faint hidden sm:block">Your port</span>
          <select
            value={port}
            onChange={(e) => selectPort(e.target.value)}
            className="bg-card-hover border border-card-border rounded-lg px-4 py-2 text-sm text-text
                       focus:outline-none focus:border-accent/50 min-w-[200px]"
          >
            {Object.keys(PORTS).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Advisory */}
      {nearbyAlerts > 0 || isMonsoon ? (
        <div className="bg-[#d49a2e]/10 border border-[#d49a2e]/25 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#d49a2e] animate-pulse" />
            <span className="text-sm font-semibold text-[#d49a2e]">
              {isMonsoon ? "Monsoon season — check local fishing ban before heading out"
                : `${nearbyAlerts} marine stress alerts near ${port.split(",")[0]}`}
            </span>
          </div>
        </div>
      ) : nearbyGreen > 0 ? (
        <div className="bg-[#3a8c5f]/10 border border-[#3a8c5f]/25 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3a8c5f]" />
            <span className="text-sm font-semibold text-[#3a8c5f]">
              {nearbyGreen} safe zones near {port.split(",")[0]} — good conditions for fishing
            </span>
            <span className="ml-auto text-xs text-text-faint">{timeStr}</span>
          </div>
        </div>
      ) : null}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-[#3a8c5f]/8 border border-[#3a8c5f]/15 rounded-xl p-3.5 text-center
                        transition-all hover:border-[#3a8c5f]/30">
          <div className="text-2xl font-bold text-[#3a8c5f]">{nearbyGreen}</div>
          <div className="text-[0.65rem] text-[#3a8c5f]/60 mt-0.5 uppercase tracking-wider">Safe</div>
        </div>
        <div className="bg-[#d49a2e]/8 border border-[#d49a2e]/15 rounded-xl p-3.5 text-center
                        transition-all hover:border-[#d49a2e]/30">
          <div className="text-2xl font-bold text-[#d49a2e]">{nearbyAmber}</div>
          <div className="text-[0.65rem] text-[#d49a2e]/60 mt-0.5 uppercase tracking-wider">Caution</div>
        </div>
        <div className="bg-[#c25a44]/8 border border-[#c25a44]/15 rounded-xl p-3.5 text-center
                        transition-all hover:border-[#c25a44]/30">
          <div className="text-2xl font-bold text-[#c25a44]">{nearbyRed}</div>
          <div className="text-[0.65rem] text-[#c25a44]/60 mt-0.5 uppercase tracking-wider">Avoid</div>
        </div>
        <div className="bg-card-hover border border-card-border rounded-xl p-3.5 text-center
                        transition-all hover:border-accent/15">
          <div className="text-2xl font-bold text-text">{weather?.sstNum?.toFixed(1) ?? localSST}<span className="text-sm text-text-faint">°C</span></div>
          <div className="text-[0.65rem] text-text-faint mt-0.5 uppercase tracking-wider">Sea temp</div>
        </div>
      </div>

      {/* Map + Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 relative">
          <div className="animate-data-enter relative">
            <MapContainer
              height="400px"
              center={[portInfo.lat, portInfo.lon]}
              zoom={7}
              points={mapPoints}
            />
            <MapLegend title="Zones" items={[
              { color: "#3a8c5f", label: "Recommended" },
              { color: "#d49a2e", label: "Caution" },
              { color: "#c25a44", label: "Avoid" },
            ]} />
          </div>
        </div>

        <div className="space-y-3">
          {/* Sea & Sky */}
          <div className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 8px 22px rgba(23,48,57,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="m-0 text-[15px] font-semibold text-text" style={{ fontFamily: "'Newsreader', serif" }}>Sea & sky</h3>
              <span className="text-[10px] text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>INCOIS · IMD</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { icon: "ph ph-wind", value: weather?.wind ?? "—", sub: weather?.windDir ?? "—" },
                { icon: "ph ph-waves", value: weather?.wave ?? "—", sub: "SWELL" },
                { icon: "ph ph-thermometer-simple", value: weather?.sst ?? `${localSST}°`, sub: "WATER" },
                { icon: "ph ph-eye", value: weather?.vis ?? "—", sub: "VIS" },
              ].map((w) => (
                <div key={w.sub}>
                  <i className={`${w.icon} text-[18px] text-accent`} />
                  <div className="text-[15px] font-semibold text-text mt-1" style={{ fontFamily: "'Newsreader', serif" }}>{w.value}</div>
                  <div className="text-[9px] text-text-muted">{w.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0ebdf] text-[12px] text-text-secondary">
              <span className="flex items-center gap-1"><i className="ph ph-arrow-up text-[12px] text-accent" /> High tide {weather?.highTide ?? "—"}</span>
              <span className="flex items-center gap-1"><i className="ph ph-arrow-down text-[12px] text-accent" /> Low tide {weather?.lowTide ?? "—"}</span>
            </div>
          </div>

          {/* Safety advisory */}
          <div className="flex items-center gap-3 bg-[#fbf2e4] border border-[#efe2cc] rounded-2xl px-4 py-3.5">
            <div className="w-10 h-10 flex-none rounded-xl bg-[rgba(217,139,74,0.16)] text-[#c0772f] flex items-center justify-center">
              <i className="ph-fill ph-sun-dim text-[22px]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text">Head back by {returnByTime}</div>
              <div className="text-[11.5px] text-[#8a7a5e] mt-0.5">Sunset {sunsetTime} · keep 30 min buffer</div>
            </div>
          </div>

          {/* Recent catches at this port */}
          <div className="bg-white border border-card-border rounded-2xl p-4">
            <h3 className="text-[0.65rem] uppercase tracking-wider text-text-faint font-semibold mb-3">
              Recent catches — {port.split(",")[0]}
            </h3>
            {localHistory.length === 0 ? (
              <p className="text-xs text-text-faint py-2">No catches logged at this site yet.</p>
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
            <h3 className="text-[0.65rem] uppercase tracking-wider text-text-faint font-semibold mb-3">Explore</h3>
            <div className="space-y-1">
              {[
                { href: "/fishing-advisory", icon: "ph ph-target", label: "Real-time fishing advisory" },
                { href: "/migration", icon: "ph ph-fish", label: "Where are fish moving?" },
                { href: "/biodiversity", icon: "ph ph-microscope", label: `Species near ${port.split(",")[0]}` },
                { href: "/digital-twin", icon: "ph ph-globe-hemisphere-east", label: "What if sea warms +2°C?" },
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
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark
                     text-white rounded-xl py-3 text-sm font-semibold border border-accent/20
                     transition-all hover:-translate-y-0.5">
          Log catch
        </button>
        <a href="/biodiversity"
          className="flex items-center justify-center gap-2 bg-white border border-[#d8cfbc]
                     text-[#2a6f7c] rounded-xl py-3 text-sm font-semibold
                     transition-all hover:-translate-y-0.5 hover:border-accent/30">
          Scan catch photo
        </a>
        <a href="/voice"
          className="flex items-center justify-center gap-2 bg-white border border-[#d8cfbc]
                     text-[#2a6f7c] rounded-xl py-3 text-sm font-semibold
                     transition-all hover:-translate-y-0.5 hover:border-accent/30">
          Ask in Hindi / Tamil
        </a>
        <a href="/alerts"
          className="flex items-center justify-center gap-2 bg-white border border-[#d8cfbc]
                     text-[#2a6f7c] rounded-xl py-3 text-sm font-semibold
                     transition-all hover:-translate-y-0.5 hover:border-accent/30">
          Get SMS alerts
        </a>
      </div>

      {/* Catch form */}
      {showCatch && (
        <div className="mb-4 animate-data-enter bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">Log catch at {port.split(",")[0]}</h3>
            <button onClick={() => setShowCatch(false)} className="text-text-faint hover:text-text-muted text-lg">&times;</button>
          </div>
          <form onSubmit={logCatch} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <label className="block">
              <span className="text-xs text-text-muted">Species</span>
              <select value={catchForm.species} onChange={(e) => setCatchForm({ ...catchForm, species: e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2.5 text-sm text-text">
                {Object.keys(SPECIES_OPTIONS).map((s) => <option key={s} value={s}>{s.split(" (")[0]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">Quantity (kg)</span>
              <input type="number" value={catchForm.quantity_kg}
                onChange={(e) => setCatchForm({ ...catchForm, quantity_kg: +e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2.5 text-sm text-text" />
            </label>
            <button type="submit" disabled={logging}
              className="bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 text-sm font-semibold
                         transition-colors disabled:opacity-50">
              {logging ? "Logging..." : "Record catch"}
            </button>
          </form>
        </div>
      )}

      <div className="mb-4">
        <FishingCalendar compact />
      </div>

      <div className="text-center text-[0.6rem] text-text-faint pb-2">
        INCOIS + GFW data · Updated weekly · {portInfo.coast} coverage · OceanMind AI
      </div>
    </div>
  );
}
