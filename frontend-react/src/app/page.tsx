"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, apiPost, apiGet } from "@/lib/api";
import { sfzFoliumColor } from "@/lib/colors";
import { useToast } from "@/components/ui/Toast";
import MapContainer, { type MarkerPoint } from "@/components/maps/MapContainer";
import MapLegend from "@/components/maps/MapLegend";
import { SPECIES_OPTIONS, LANDING_SITES } from "@/lib/constants";
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
          <div className="text-2xl font-bold text-text">{localSST}<span className="text-sm text-text-faint">°C</span></div>
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
              { color: "#4caf50", label: "Safe — go fish" },
              { color: "#ff9800", label: "Caution" },
              { color: "#f44336", label: "Avoid" },
            ]} />
          </div>
        </div>

        <div className="space-y-3">
          {/* Local conditions */}
          <div className="bg-white border border-card-border rounded-2xl p-4">
            <h3 className="text-[0.65rem] uppercase tracking-wider text-text-faint font-semibold mb-3">
              Conditions near {port.split(",")[0]}
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Coast</span>
                <span className="text-text">{portInfo.coast}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Sea temp</span>
                <span className="text-text">{localSST}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Alerts nearby</span>
                <span className={nearbyAlerts === 0 ? "text-[#3a8c5f]" : "text-[#d49a2e]"}>
                  {nearbyAlerts === 0 ? "None" : nearbyAlerts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Season</span>
                <span className="text-text">{isMonsoon ? "Monsoon" : "Open season"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Zones in range</span>
                <span className="text-text">{nearbyFeatures.length}</span>
              </div>
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
              <div className="space-y-2">
                {localHistory.slice(0, 5).map((r) => (
                  <div key={r.transaction_id} className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">{r.species_name}</span>
                    <span className="text-text-faint text-xs">{r.quantity_kg} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div className="bg-white border border-card-border rounded-2xl p-4">
            <h3 className="text-[0.65rem] uppercase tracking-wider text-text-faint font-semibold mb-3">More info</h3>
            <div className="space-y-2">
              <a href="/migration" className="block text-sm text-text-muted hover:text-accent transition-colors">
                Where are fish moving this week?
              </a>
              <a href="/biodiversity" className="block text-sm text-text-muted hover:text-accent transition-colors">
                What species are near {port.split(",")[0]}?
              </a>
              <a href="/digital-twin" className="block text-sm text-text-muted hover:text-accent transition-colors">
                What if the sea warms +2°C?
              </a>
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

      <div className="text-center text-[0.6rem] text-text-faint pb-2">
        INCOIS + GFW data · Updated weekly · {portInfo.coast} coverage · OceanMind AI
      </div>
    </div>
  );
}
