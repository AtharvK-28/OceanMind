"use client";
import { CircleMarker, Popup, Tooltip } from "react-leaflet";

export interface MarkerPoint {
  lat: number;
  lng: number;
  color: string;
  radius?: number;
  fillOpacity?: number;
  tooltip?: string;
  popup?: string;
}

export default function CircleMarkerLayer({ points }: { points: MarkerPoint[] }) {
  return (
    <>
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={p.radius ?? 6}
          pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: p.fillOpacity ?? 0.65, weight: 1 }}
        >
          {p.tooltip && <Tooltip>{p.tooltip}</Tooltip>}
          {p.popup && <Popup><div dangerouslySetInnerHTML={{ __html: p.popup }} /></Popup>}
        </CircleMarker>
      ))}
    </>
  );
}
