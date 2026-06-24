"use client";
import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MarkerPoint {
  lat: number;
  lng: number;
  color: string;
  radius?: number;
  fillOpacity?: number;
  tooltip?: string;
  popup?: string;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  height?: string;
  points?: MarkerPoint[];
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [map, center[0], center[1], zoom]);
  return null;
}

function thinPoints(points: MarkerPoint[], zoomLevel: number): MarkerPoint[] {
  // At zoom 5 (all-India): show every 4th point
  // At zoom 6: every 2nd
  // At zoom 7+: show all
  if (zoomLevel >= 7) return points;
  const step = zoomLevel <= 5 ? 4 : 2;
  return points.filter((_, i) => i % step === 0);
}

function AdaptiveMarkers({ points }: { points: MarkerPoint[] }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const visible = thinPoints(points, zoom);
  const markerRadius = zoom >= 8 ? 8 : zoom >= 7 ? 7 : zoom >= 6 ? 5 : 4;

  return (
    <>
      {visible.map((p, i) => (
        <CircleMarker
          key={`${p.lat}-${p.lng}-${p.color}`}
          center={[p.lat, p.lng]}
          radius={p.radius ?? markerRadius}
          pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: p.fillOpacity ?? 0.65, weight: 1 }}
        >
          {p.tooltip && <Tooltip>{p.tooltip}</Tooltip>}
          {p.popup && <Popup><div dangerouslySetInnerHTML={{ __html: p.popup }} /></Popup>}
        </CircleMarker>
      ))}
    </>
  );
}

export default function LeafletMap({ center = [15, 78], zoom = 5, height = "480px", points = [] }: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/8" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} zoomControl={true}>
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <AdaptiveMarkers points={points} />
      </MapContainer>
    </div>
  );
}
