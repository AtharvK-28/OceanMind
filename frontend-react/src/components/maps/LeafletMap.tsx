"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
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

export default function LeafletMap({ center = [15, 78], zoom = 5, height = "480px", points = [] }: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/8" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} zoomControl={true}>
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.map((p, i) => (
          <CircleMarker
            key={`${p.lat}-${p.lng}-${p.color}`}
            center={[p.lat, p.lng]}
            radius={p.radius ?? 6}
            pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: p.fillOpacity ?? 0.65, weight: 1 }}
          >
            {p.tooltip && <Tooltip>{p.tooltip}</Tooltip>}
            {p.popup && <Popup><div dangerouslySetInnerHTML={{ __html: p.popup }} /></Popup>}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
