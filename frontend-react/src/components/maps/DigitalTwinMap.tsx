"use client";
import { useEffect, useRef, useState } from "react";
import {
  MapContainer, TileLayer, CircleMarker, Popup, Tooltip,
  Rectangle, useMap, useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MarkerPoint } from "./LeafletMap";
import { type FishingZone, INDIAN_ZONES, INDIA_BOUNDS, INDIA_CENTER, INDIA_ZOOM } from "./zones";

// ── Helpers ────────────────────────────────────────────────────────────────
function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center[0], center[1], zoom]);
  return null;
}

function BoundsConstraint() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(INDIA_BOUNDS);
    map.options.minZoom = 4;
  }, [map]);
  return null;
}

/** Calls invalidateSize multiple times to fix tile-blank issue with dynamic imports */
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    // Fire several times to catch any async layout reflows
    const timers = [50, 200, 500, 1000, 2000].map((ms) =>
      setTimeout(() => map.invalidateSize(), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

/** Uses ResizeObserver on the map container so tiles repaint on any layout shift */
function ResizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function AdaptiveMarkers({ points }: { points: MarkerPoint[] }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const step = zoom >= 7 ? 1 : zoom >= 6 ? 2 : 3;
  const visible = points.filter((_, i) => i % step === 0);
  const r = zoom >= 8 ? 9 : zoom >= 7 ? 7 : zoom >= 6 ? 5 : 4;
  return (
    <>
      {visible.map((p, i) => (
        <CircleMarker
          key={`${p.lat}-${p.lng}-${i}`}
          center={[p.lat, p.lng]}
          radius={p.radius ?? r}
          pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: p.fillOpacity ?? 0.72, weight: 1 }}
        >
          {p.tooltip && <Tooltip>{p.tooltip}</Tooltip>}
          {p.popup && <Popup><div dangerouslySetInnerHTML={{ __html: p.popup }} /></Popup>}
        </CircleMarker>
      ))}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface DigitalTwinMapProps {
  mhiPoints: MarkerPoint[];
  migPoints: MarkerPoint[];
  activeZone: FishingZone;
  height?: string;
}

export default function DigitalTwinMap({ mhiPoints, migPoints, activeZone, height = "460px" }: DigitalTwinMapProps) {
  const [layer, setLayer] = useState<"mhi" | "mig" | "both">("mhi");
  // mapKey forces a full remount when needed (e.g. first real render after dynamic import)
  const [mapKey, setMapKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure the map remounts cleanly after the dynamic import settles
  useEffect(() => {
    setMapKey((k) => k + 1);
  }, []);

  const points = layer === "mhi" ? mhiPoints : layer === "mig" ? migPoints : [...mhiPoints, ...migPoints];

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden border border-[#ece5d6] relative"
      style={{ height }}
    >
      {/* Layer toggle */}
      <div className="absolute top-3 right-3 z-[500] flex gap-1 bg-white/90 backdrop-blur rounded-xl p-1 shadow-sm border border-[#ece5d6]">
        {(["mhi", "mig", "both"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLayer(l)}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all"
            style={{
              background: layer === l ? "#1f7a8c" : "transparent",
              color: layer === l ? "white" : "#6d7e80",
            }}
          >
            {l === "mhi" ? "MHI Δ" : l === "mig" ? "Migration" : "Both"}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[500] bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-sm border border-[#ece5d6] text-[10px] space-y-1">
        {layer !== "mig" && (
          <>
            <div className="font-semibold text-[#16323a] mb-1">ΔMHI</div>
            {[{ c: "#388e3c", l: "Improving" }, { c: "#fbc02d", l: "Slight decline" }, { c: "#f57c00", l: "Moderate" }, { c: "#d32f2f", l: "Severe" }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: c }} /><span className="text-[#46585b]">{l}</span></div>
            ))}
          </>
        )}
        {layer !== "mhi" && (
          <>
            <div className="font-semibold text-[#16323a] mt-1">Migration Δ</div>
            {[{ c: "#1f7a8c", l: "Increased" }, { c: "#8a9698", l: "Stable" }, { c: "#c25a44", l: "Reduced" }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: c }} /><span className="text-[#46585b]">{l}</span></div>
            ))}
          </>
        )}
      </div>

      <MapContainer
        key={mapKey}
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={0.9}
        minZoom={4}
        style={{ height: "100%", width: "100%", background: "#c8e3e8" }}
        zoomControl={true}
      >
        <InvalidateOnMount />
        <ResizeInvalidator />
        <BoundsConstraint />
        <FlyTo center={activeZone.center} zoom={activeZone.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        {/* Highlight selected zone bbox */}
        {activeZone.id !== "all" && (
          <Rectangle
            bounds={activeZone.bbox}
            pathOptions={{ color: "#1f7a8c", weight: 1.5, fill: true, fillColor: "#1f7a8c", fillOpacity: 0.04, dashArray: "4 3" }}
          />
        )}
        <AdaptiveMarkers points={points} />
      </MapContainer>
    </div>
  );
}
