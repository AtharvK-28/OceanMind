"use client";
import { useState, useMemo, useEffect } from "react";
import GlobeContainer, { type MigrationArc, type MigrationPoint } from "@/components/maps/GlobeContainer";
import FishingCalendar from "@/components/ui/FishingCalendar";

interface Hotspot {
  lat: number;
  lng: number;
  label: string;
  type: "spawning" | "feeding" | "nursery" | "waypoint";
}

interface SpeciesRoute {
  id: string;
  name: string;
  scientific: string;
  color: string;
  colorLight: string;
  optTemp: string;
  shiftRate: string;
  status: string;
  description: string;
  source: string;
  focusLat: number;
  focusLng: number;
  distance: string;
  depth: string;
  peakMonths: number[];
  waypoints: [number, number][];
  hotspots: Hotspot[];
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Major Indian Ocean currents (real oceanographic data)
const OCEAN_CURRENTS: { name: string; waypoints: [number, number][]; color: string }[] = [
  { name: "Somali Current", waypoints: [[2,42],[-1,46],[-3,50],[-4.5,55]], color: "rgba(79,195,247,0.25)" },
  { name: "SW Monsoon Current", waypoints: [[0,55],[2,65],[4,73],[6,78],[8,82]], color: "rgba(79,195,247,0.20)" },
  { name: "NE Monsoon Current", waypoints: [[6,82],[4,76],[2,70],[0,63]], color: "rgba(100,180,230,0.18)" },
  { name: "West India Coastal Current", waypoints: [[8,76],[12,74],[16,73],[20,70]], color: "rgba(79,195,247,0.22)" },
  { name: "East India Coastal Current", waypoints: [[8,80],[12,81],[16,82],[20,87]], color: "rgba(79,195,247,0.18)" },
  { name: "Equatorial Counter-current", waypoints: [[-3,42],[-2,55],[-1,68],[0,80]], color: "rgba(100,180,230,0.15)" },
];

const SPECIES: SpeciesRoute[] = [
  {
    id: "yellowfin", name: "Yellowfin Tuna", scientific: "Thunnus albacares",
    color: "#d49a2e", colorLight: "#f7efdb",
    optTemp: "20–30°C", shiftRate: "0.3°/°C", status: "Near Threatened",
    distance: "Avg 710 nmi", depth: "0–280 m (vertical migrator)",
    peakMonths: [3,4,5,11,12],
    source: "IOTC RTTP-IO (63,328 tagged); PMC12837308; IOTC 2021",
    description: "Present year-round in Indian EEZ. Follows SST fronts (20–30°C) from the deep equatorial and western Indian Ocean to shelf boundaries near Andaman & Lakshadweep. Extreme daily vertical migration — dives deep by day, surfaces to feed at night.",
    focusLat: 5, focusLng: 72,
    // Routed around India via ocean — Somali Basin → Equatorial → Maldives → Lakshadweep, then south of Sri Lanka → Andaman
    waypoints: [[-5.00,42.00],[-3.00,52.00],[0.00,62.00],[2.00,68.00],[4.00,73.22],[10.57,72.64],[7.50,76.00],[5.50,79.50],[5.00,84.00],[7.00,89.00],[10.00,92.50],[12.00,93.00]],
    hotspots: [
      { lat: -5.00, lng: 42.00, label: "Somali Basin", type: "feeding" },
      { lat: 0.00, lng: 62.00, label: "Equatorial Deep", type: "feeding" },
      { lat: 4.00, lng: 73.22, label: "Maldives", type: "spawning" },
      { lat: 10.57, lng: 72.64, label: "Lakshadweep Shelf", type: "feeding" },
      { lat: 5.50, lng: 79.50, label: "South of Sri Lanka", type: "waypoint" },
      { lat: 12.00, lng: 93.00, label: "Andaman Shelf", type: "feeding" },
    ],
  },
  {
    id: "skipjack", name: "Skipjack Tuna", scientific: "Katsuwonus pelamis",
    color: "#1f7a8c", colorLight: "#e0f0f2",
    optTemp: "24–30°C", shiftRate: "0.35°/°C", status: "Least Concern",
    distance: "Trans-oceanic", depth: "0–260 m (epipelagic)",
    peakMonths: [11,12,1,2,3],
    source: "IOTC RTTP-IO; FishSource 2021; Frontiers Mar. Sci. 2026",
    description: "Peak Nov–Mar. Migrates from Maldives Ridge and Seychelles-Chagos Thermocline Ridge to Lakshadweep atolls. Strictly surface-dwelling, travels in massive fast schools. Retreats to open-ocean ridges during SW monsoon (Jun–Sep) due to low surface oxygen.",
    focusLat: 5, focusLng: 70,
    waypoints: [[-6.00,56.00],[-4.68,55.49],[-2.00,60.00],[0.00,65.00],[3.20,73.22],[8.00,72.50],[10.57,72.64]],
    hotspots: [
      { lat: -4.68, lng: 55.49, label: "Seychelles-Chagos Ridge", type: "feeding" },
      { lat: 0.00, lng: 65.00, label: "Maldives Ridge", type: "feeding" },
      { lat: 3.20, lng: 73.22, label: "Maldives Convergence", type: "feeding" },
      { lat: 10.57, lng: 72.64, label: "Lakshadweep Atolls", type: "spawning" },
    ],
  },
  {
    id: "mackerel", name: "Indian Mackerel", scientific: "Rastrelliger kanagurta",
    color: "#3a8c5f", colorLight: "#eaf3ef",
    optTemp: "26–30°C", shiftRate: "0.4°/°C", status: "Least Concern",
    distance: "Kanyakumari → Ratnagiri", depth: "50–100 m → <25 m",
    peakMonths: [10,11,12,1,2],
    source: "CMFRI 2020; Jamaludin et al. 2015 (PLoS ONE); Springer 2024",
    description: "Migrates perpendicularly from the deep continental slope (50–100m) to shallow coastal surf zones (<25m) driven by SW monsoon upwelling. Starts Aug in south, peaks Oct–Dec. Moves in massive arrow-head shoals. Retreats to deep slope when summer depletes nutrients.",
    focusLat: 12, focusLng: 74,
    waypoints: [[8.08,77.00],[8.50,76.50],[9.50,76.00],[9.97,75.80],[11.25,75.40],[12.87,74.50],[14.80,73.80],[16.99,73.00]],
    hotspots: [
      { lat: 8.08, lng: 77.00, label: "Kanyakumari", type: "spawning" },
      { lat: 9.97, lng: 75.80, label: "Kochi Shelf", type: "feeding" },
      { lat: 12.87, lng: 74.50, label: "Mangalore Shelf", type: "feeding" },
      { lat: 16.99, lng: 73.00, label: "Ratnagiri", type: "feeding" },
    ],
  },
  {
    id: "sardine", name: "Oil Sardine", scientific: "Sardinella longiceps",
    color: "#c25a44", colorLight: "#f6e6e1",
    optTemp: "<29°C (trigger)", shiftRate: "0.5°/°C", status: "Least Concern",
    distance: "40–50 nmi offshore → surf zone", depth: "Thermocline → <10 m",
    peakMonths: [10,11,12,1],
    source: "CMFRI; Xu & Mohamed 2009; Frontiers Mar. Sci. 2018",
    description: "Shoals begin shoreward migration in Jun with pre-monsoon rains. Monsoon rain drops coastal temp below 29°C and salinity, triggering diatom blooms (Fragilaria oceanica) — their food. Peaks Oct–Jan. General northward drift along Kerala–Karnataka coast. El Niño can abort migration entirely.",
    focusLat: 10, focusLng: 75,
    waypoints: [[8.00,76.80],[8.50,76.40],[9.00,76.10],[9.50,75.90],[9.97,75.70],[10.50,75.40],[11.25,75.10],[12.87,74.50]],
    hotspots: [
      { lat: 8.00, lng: 76.80, label: "Offshore Thermocline", type: "feeding" },
      { lat: 9.50, lng: 75.90, label: "Alappuzha Surf", type: "spawning" },
      { lat: 9.97, lng: 75.70, label: "Kochi Inshore", type: "spawning" },
      { lat: 12.87, lng: 74.50, label: "Karnataka Coast", type: "nursery" },
    ],
  },
  {
    id: "hilsa", name: "Hilsa Shad", scientific: "Tenualosa ilisha",
    color: "#7e57c2", colorLight: "#ede7f6",
    optTemp: "18–26°C", shiftRate: "0.6°/°C", status: "Least Concern",
    distance: "1,200+ km upstream", depth: "Sub-surface pelagic → riverine",
    peakMonths: [7,8,9,10,11],
    source: "IUCN 2014; BdFISH 2013; Raman et al. 2015",
    description: "Anadromous (like salmon). Primary run Jul–Nov during SW monsoon floods. Monsoon freshwater discharge lowers estuary salinity, acting as a homing beacon. East coast: Hooghly-Bhagirathi (Ganges delta), Brahmaputra, Godavari. West coast: Narmada, Tapti rivers. Juveniles (jatka) stay in river nurseries 5–6 months before returning to sea.",
    focusLat: 21, focusLng: 88,
    waypoints: [[16.00,88.50],[18.00,89.00],[20.00,89.50],[21.00,88.80],[22.00,88.30],[22.60,88.10],[23.00,88.40],[24.50,88.00]],
    hotspots: [
      { lat: 16.00, lng: 88.50, label: "N. Bay of Bengal", type: "feeding" },
      { lat: 20.00, lng: 89.50, label: "Estuary Approach", type: "waypoint" },
      { lat: 22.00, lng: 88.30, label: "Hooghly-Bhagirathi", type: "spawning" },
      { lat: 22.60, lng: 88.10, label: "Ganges Delta", type: "spawning" },
      { lat: 24.50, lng: 88.00, label: "Upper Ganges", type: "nursery" },
    ],
  },
];

const HOTSPOT_STYLE: Record<string, { size: number; emoji: string; label: string }> = {
  spawning: { size: 0.6, emoji: "🥚", label: "Spawning" },
  feeding:  { size: 0.45, emoji: "🐟", label: "Feeding" },
  nursery:  { size: 0.5, emoji: "🏠", label: "Nursery" },
  waypoint: { size: 0.3, emoji: "📍", label: "Waypoint" },
};

export default function MigrationPage() {
  const [selectedId, setSelectedId] = useState<string | "all">("sardine");
  const [showCurrents, setShowCurrents] = useState(true);
  const [rotating, setRotating] = useState(true);
  // Honour reduced-motion: don't auto-spin the globe for users who opt out.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setRotating(false);
  }, []);
  const [climateShift, setClimateShift] = useState(0); // 0, 1, or 2 degrees
  const [month, setMonth] = useState(new Date().getMonth());
  const [panelOpen, setPanelOpen] = useState(true);

  const activeSpecies = selectedId === "all" ? SPECIES : SPECIES.filter(s => s.id === selectedId);
  const focusSpecies = selectedId === "all" ? SPECIES[0] : (SPECIES.find(s => s.id === selectedId) ?? SPECIES[0]);

  const arcs: MigrationArc[] = useMemo(() => {
    const result: MigrationArc[] = [];

    // Species arcs — shift poleward based on climate projection
    activeSpecies.forEach(sp => {
      const shiftRate = parseFloat(sp.shiftRate) || 0.4;
      const latShift = climateShift * shiftRate; // degrees poleward per °C warming
      const wp = sp.waypoints.map(([lat, lng]) => [lat + latShift, lng] as [number, number]);
      const isPeak = sp.peakMonths.includes(month + 1);
      wp.slice(0, -1).forEach((start, i) => {
        result.push({
          startLat: start[0], startLng: start[1],
          endLat: wp[i + 1][0], endLng: wp[i + 1][1],
          color: isPeak ? sp.color : sp.color + "60",
        });
      });

      // Ghost arcs showing original position when shifted
      if (climateShift > 0) {
        const origWp = sp.waypoints;
        origWp.slice(0, -1).forEach((start, i) => {
          result.push({
            startLat: start[0], startLng: start[1],
            endLat: origWp[i + 1][0], endLng: origWp[i + 1][1],
            color: sp.color + "18",
          });
        });
      }
    });

    // Ocean current arcs
    if (showCurrents) {
      OCEAN_CURRENTS.forEach(c => {
        const wp = c.waypoints;
        wp.slice(0, -1).forEach((start, i) => {
          result.push({
            startLat: start[0], startLng: start[1],
            endLat: wp[i + 1][0], endLng: wp[i + 1][1],
            color: c.color,
          });
        });
      });
    }

    return result;
  }, [activeSpecies, showCurrents, month, climateShift]);

  const points: MigrationPoint[] = useMemo(() => {
    return activeSpecies.flatMap(sp => {
      const shiftRate = parseFloat(sp.shiftRate) || 0.4;
      const latShift = climateShift * shiftRate;
      return sp.hotspots.map(h => ({
        lat: h.lat + latShift, lng: h.lng,
        size: HOTSPOT_STYLE[h.type].size,
        color: sp.color,
        label: `${h.label} (${HOTSPOT_STYLE[h.type].label})`,
      }));
    });
  }, [activeSpecies, climateShift]);

  const currentMonth = month + 1;
  const isMonsoon = currentMonth >= 6 && currentMonth <= 9;

  return (
    <div className="animate-page-enter -m-6 -mt-6 lg:-mt-6 hide-scrollbar" style={{ minHeight: "calc(100vh - 0px)" }}>
      <style>{`main { scrollbar-width: none !important; -ms-overflow-style: none !important; } main::-webkit-scrollbar { display: none !important; }`}</style>

      {/* Top bar */}
      <div className="sticky top-0 z-30 px-6 py-4" style={{ background: "linear-gradient(180deg, #f1ece1 70%, transparent)" }}>
        <div className="flex items-center gap-4 mb-3">
          <h1 className="text-[22px] font-semibold text-[#15323a] m-0" style={{ fontFamily: "'Newsreader', serif" }}>
            Fish Migration Tracker
          </h1>
          <span className="text-[9px] tracking-[0.1em] text-text-muted px-2 py-1 rounded-md bg-card-hover border border-card-border" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            CMFRI · IOTC · IUCN
          </span>
        </div>

        {/* Species selector + All toggle */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSelectedId("all")}
            className="flex-none flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full border transition-all duration-200"
            style={{
              background: selectedId === "all" ? "#15434c" : "white",
              borderColor: selectedId === "all" ? "#15434c" : "#ece5d6",
              color: selectedId === "all" ? "white" : "#16323a",
              boxShadow: selectedId === "all" ? "0 4px 14px rgba(21,67,76,0.3)" : "0 1px 2px rgba(23,48,57,0.04)",
            }}>
            <i className="ph ph-stack" style={{ fontSize: 16 }} />
            <span className="text-[12.5px] font-semibold whitespace-nowrap">All Species</span>
          </button>
          {SPECIES.map(sp => {
            const active = selectedId === sp.id;
            const isPeak = sp.peakMonths.includes(currentMonth);
            return (
              <button key={sp.id} onClick={() => setSelectedId(sp.id)}
                className="flex-none flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full border transition-all duration-200"
                style={{
                  background: active ? sp.color : "white",
                  borderColor: active ? sp.color : "#ece5d6",
                  color: active ? "white" : "#16323a",
                  boxShadow: active ? `0 4px 14px ${sp.color}40` : "0 1px 2px rgba(23,48,57,0.04)",
                  transform: active ? "scale(1.03)" : undefined,
                }}>
                <i className="ph-fill ph-fish" style={{ fontSize: 16, opacity: active ? 1 : 0.5 }} />
                <div className="text-left">
                  <div className="text-[12.5px] font-semibold leading-tight whitespace-nowrap">{sp.name}</div>
                  <div className="text-[9.5px] leading-tight whitespace-nowrap" style={{ opacity: active ? 0.8 : 0.5 }}>
                    {isPeak ? "● Peak season" : sp.scientific}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Globe */}
      <div className="relative" style={{ marginTop: -8 }}>
        <div className="w-full" style={{ height: 560 }}>
          <GlobeContainer arcs={arcs} points={points} height={560} focusLat={focusSpecies.focusLat} focusLng={focusSpecies.focusLng} rotating={rotating} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: "linear-gradient(transparent, #f1ece1)" }} />

        {/* Controls overlay — bottom left */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 z-20">
          <button onClick={() => setRotating(!rotating)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold border backdrop-blur-md transition-all"
            style={{
              background: rotating ? "rgba(255,255,255,0.85)" : "rgba(31,122,140,0.15)",
              borderColor: rotating ? "rgba(236,229,214,0.8)" : "rgba(31,122,140,0.3)",
              color: rotating ? "#8a9698" : "#1f7a8c",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
            <i className={rotating ? "ph ph-pause" : "ph ph-play"} style={{ fontSize: 14 }} />
            {rotating ? "Pause" : "Rotate"}
          </button>
          <button onClick={() => setShowCurrents(!showCurrents)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold border backdrop-blur-md transition-all"
            style={{
              background: showCurrents ? "rgba(79,195,247,0.15)" : "rgba(255,255,255,0.85)",
              borderColor: showCurrents ? "rgba(79,195,247,0.3)" : "rgba(236,229,214,0.8)",
              color: showCurrents ? "#4fc3f7" : "#8a9698",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
            <i className="ph ph-waves" style={{ fontSize: 14 }} />
            Currents
          </button>
          {/* Climate shift toggle */}
          <div className="flex items-center gap-0 rounded-xl border backdrop-blur-md overflow-hidden"
               style={{ background: "rgba(255,255,255,0.85)", borderColor: climateShift > 0 ? "rgba(194,90,68,0.4)" : "rgba(236,229,214,0.8)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            {[0, 1, 2].map(deg => (
              <button key={deg} onClick={() => setClimateShift(deg)}
                className="px-2.5 py-2 text-[11px] font-semibold transition-all"
                style={{
                  background: climateShift === deg
                    ? deg === 0 ? "#1f7a8c" : deg === 1 ? "#d49a2e" : "#c25a44"
                    : "transparent",
                  color: climateShift === deg ? "white" : "#8a9698",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                {deg === 0 ? "Now" : `+${deg}°C`}
              </button>
            ))}
          </div>
        </div>

        {/* Month slider — bottom center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md border"
             style={{ background: "rgba(255,255,255,0.88)", borderColor: "rgba(236,229,214,0.8)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
          <i className="ph ph-calendar" style={{ fontSize: 14, color: "#8a9698" }} />
          <div className="flex gap-1">
            {MONTHS.map((m, i) => {
              const isActive = i === month;
              const isPeakForActive = selectedId !== "all" && focusSpecies.peakMonths.includes(i + 1);
              return (
                <button key={m} onClick={() => setMonth(i)}
                  className="w-7 h-7 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center"
                  style={{
                    background: isActive ? "#1f7a8c" : isPeakForActive ? focusSpecies.color + "20" : "transparent",
                    color: isActive ? "white" : isPeakForActive ? focusSpecies.color : "#8a9698",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                  {m.charAt(0)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel toggle */}
        <button onClick={() => setPanelOpen(!panelOpen)}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-card-border flex items-center justify-center text-text-muted hover:text-text transition-colors"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
          <i className="ph ph-sidebar-simple text-[18px]" />
        </button>

        {/* Floating detail panel */}
        {panelOpen && selectedId !== "all" && (
          <div className="absolute top-4 right-14 z-20 w-[310px] max-h-[520px] overflow-y-auto hide-scrollbar rounded-2xl backdrop-blur-md border border-white/30"
               style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 8px 32px rgba(23,48,57,0.15)" }}>

            <div className="p-5 pb-4" style={{ borderBottom: "1px solid #f0ebdf" }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: focusSpecies.colorLight, color: focusSpecies.color }}>
                  <i className="ph-fill ph-fish" style={{ fontSize: 24 }} />
                </span>
                <div>
                  <div className="text-[17px] font-semibold text-[#15323a]" style={{ fontFamily: "'Newsreader', serif" }}>{focusSpecies.name}</div>
                  <div className="text-[11px] text-text-muted italic">{focusSpecies.scientific}</div>
                </div>
              </div>
              <p className="text-[12.5px] text-[#52636a] leading-[1.55] m-0">{focusSpecies.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-0" style={{ borderBottom: "1px solid #f0ebdf" }}>
              {[
                { icon: "ph ph-thermometer-simple", label: "SST", value: focusSpecies.optTemp },
                { icon: "ph ph-ruler", label: "DEPTH", value: focusSpecies.depth },
                { icon: "ph ph-path", label: "RANGE", value: focusSpecies.distance },
              ].map((s, i) => (
                <div key={s.label} className="text-center py-3.5 px-2" style={{ borderRight: i < 2 ? "1px solid #f0ebdf" : undefined }}>
                  <i className={`${s.icon} text-[15px]`} style={{ color: focusSpecies.color }} />
                  <div className="text-[12px] font-semibold text-[#16323a] mt-1" style={{ fontFamily: "'Newsreader', serif" }}>{s.value}</div>
                  <div className="text-[7.5px] text-text-muted tracking-widest mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Waypoints with type icons */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f0ebdf" }}>
              <div className="text-[9px] uppercase tracking-[0.12em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Migration route</div>
              {focusSpecies.hotspots.map((h, i) => (
                <div key={i} className="flex items-start gap-3 mb-0">
                  <div className="flex flex-col items-center pt-0.5">
                    <span className="w-[9px] h-[9px] rounded-full flex-none"
                      style={{ border: `2px solid ${focusSpecies.color}`, background: h.type === "spawning" ? focusSpecies.color : "white" }} />
                    {i < focusSpecies.hotspots.length - 1 && <div className="w-[1.5px] h-5" style={{ background: focusSpecies.color + "30" }} />}
                  </div>
                  <div className="pb-2 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-medium text-[#16323a]">{h.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: focusSpecies.colorLight, color: focusSpecies.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {HOTSPOT_STYLE[h.type].label}
                      </span>
                    </div>
                    <div className="text-[9.5px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {Math.abs(h.lat).toFixed(2)}°{h.lat >= 0 ? "N" : "S"}, {h.lng.toFixed(2)}°E
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Peak season */}
            <div className="px-5 py-3.5 flex flex-wrap gap-2" style={{ borderBottom: "1px solid #f0ebdf" }}>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: focusSpecies.colorLight, color: focusSpecies.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                <i className="ph ph-shield-check" style={{ fontSize: 11 }} /> {focusSpecies.status}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: focusSpecies.colorLight, color: focusSpecies.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                <i className="ph ph-calendar" style={{ fontSize: 11 }} />
                Peak: {focusSpecies.peakMonths.map(m => MONTHS[m-1]).join(", ")}
              </span>
            </div>

            <div className="px-5 py-3">
              <div className="text-[8px] uppercase tracking-[0.12em] text-text-faint mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Sources</div>
              <div className="text-[10.5px] text-text-muted leading-relaxed">{focusSpecies.source}</div>
            </div>
          </div>
        )}

        {/* All-species legend when "All" is selected */}
        {panelOpen && selectedId === "all" && (
          <div className="absolute top-4 right-14 z-20 w-[280px] rounded-2xl backdrop-blur-md border border-white/30 p-5"
               style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 8px 32px rgba(23,48,57,0.15)" }}>
            <div className="text-[9px] uppercase tracking-[0.12em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>All species — {MONTHS[month]}</div>
            {SPECIES.map(sp => {
              const isPeak = sp.peakMonths.includes(currentMonth);
              return (
                <div key={sp.id} className="flex items-center gap-3 py-2 border-t border-[#f0ebdf] first:border-0">
                  <span className="w-3 h-3 rounded-full flex-none" style={{ background: sp.color, opacity: isPeak ? 1 : 0.35 }} />
                  <div className="flex-1">
                    <div className="text-[12.5px] font-medium text-text">{sp.name}</div>
                    <div className="text-[10px] text-text-muted">{sp.distance}</div>
                  </div>
                  {isPeak && <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sp.colorLight, color: sp.color, fontFamily: "'IBM Plex Mono', monospace" }}>PEAK</span>}
                </div>
              );
            })}
            {showCurrents && (
              <div className="mt-3 pt-3 border-t border-[#f0ebdf]">
                <div className="flex items-center gap-2 text-[10px] text-text-faint">
                  <span className="w-6 h-[2px] rounded-full" style={{ background: "rgba(79,195,247,0.5)" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Ocean currents</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fishing calendar + climate info */}
      <div className="px-6 pb-6 pt-2 space-y-5">
        <FishingCalendar currentMonth={month} />

        {/* Climate shift info — only show when shifted */}
        {climateShift > 0 && (
          <div className="flex items-start gap-4 p-5 rounded-2xl border border-[#e8cabf] animate-data-enter" style={{ background: "#f6e6e1" }}>
            <div className="w-11 h-11 flex-none rounded-xl flex items-center justify-center" style={{ background: "rgba(194,90,68,0.15)", color: "#c25a44" }}>
              <i className="ph-fill ph-thermometer-hot" style={{ fontSize: 22 }} />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-[#9d3c29]" style={{ fontFamily: "'Newsreader', serif" }}>
                +{climateShift}°C Climate Projection
              </div>
              <div className="text-[12.5px] text-[#a85a47] mt-1 leading-relaxed">
                All migration routes shifted poleward based on species-specific shift rates (Cheung et al. 2013).
                Ghost arcs show original positions. Oil Sardine shifts the most (+{(climateShift * 0.5).toFixed(1)}° lat)
                while Yellowfin Tuna shifts the least (+{(climateShift * 0.3).toFixed(1)}° lat).
                {climateShift >= 2 && " At +2°C, sardine and mackerel fisheries may shift significantly beyond current Kerala–Karnataka grounds."}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {activeSpecies.map(sp => {
                  const rate = parseFloat(sp.shiftRate) || 0.4;
                  return (
                    <span key={sp.id} className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: sp.colorLight, color: sp.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: sp.color }} />
                      {sp.name}: +{(climateShift * rate).toFixed(1)}°
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
