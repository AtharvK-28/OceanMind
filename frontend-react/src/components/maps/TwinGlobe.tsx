"use client";
import { useEffect, useMemo, useRef } from "react";
import Globe, { type GlobeInstance } from "globe.gl";

export interface TwinCell {
  lat: number;
  lon: number;
  baseline: number;
  coeff: number;
}

interface Props {
  cells: TwinCell[];
  week: number;
  height?: number;
  rotating?: boolean;
}

// MHI colour ramp: green (healthy) → amber → red (collapse)
function mhiColor(v: number): string {
  const stops: [number, [number, number, number]][] = [
    [95, [46, 125, 91]],   // deep green
    [70, [90, 170, 120]],  // green
    [55, [212, 154, 46]],  // amber
    [40, [200, 100, 60]],  // orange
    [25, [175, 52, 42]],   // red
    [0, [120, 26, 22]],    // deep red
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [hi, chi] = stops[i];
    const [lo, clo] = stops[i + 1];
    if (v >= lo) {
      const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
      const c = chi.map((h, k) => Math.round(clo[k] + (h - clo[k]) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return "rgb(120,26,22)";
}

export default function TwinGlobe({ cells, week, height = 520, rotating = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);

  // Project each cell to the current week: keep raw MHI + stress so the hex-bin
  // layer can aggregate them into clean averaged columns.
  const binPoints = useMemo(() => {
    const df = week > 0 ? Math.sqrt(week / 4) : 0;
    return cells.map((c) => {
      const projected = Math.max(0, Math.min(100, c.baseline - c.coeff * df));
      return { lat: c.lat, lng: c.lon, mhi: projected, stress: c.baseline - projected };
    });
  }, [cells, week]);

  const avg = (pts: any[], key: string) =>
    pts.reduce((s, p) => s + p[key], 0) / Math.max(1, pts.length);

  // Init once
  useEffect(() => {
    if (!containerRef.current) return;
    const globe = new Globe(containerRef.current)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .width(containerRef.current.clientWidth)
      .height(height)
      .showAtmosphere(true)
      .atmosphereColor("#8fe3d8")
      .atmosphereAltitude(0.22)
      .pointOfView({ lat: 12, lng: 78, altitude: 1.15 }, 0)
      // Hex-bin: aggregate the cell grid into clean uniform hexagonal columns.
      .hexBinPointsData(binPoints)
      .hexBinPointLat("lat")
      .hexBinPointLng("lng")
      .hexBinResolution(3)
      .hexBinMerge(false)
      .hexTransitionDuration(500)
      .hexAltitude((d: any) => Math.max(0.008, (avg(d.points, "stress") / 100) * 0.5))
      .hexTopColor((d: any) => mhiColor(avg(d.points, "mhi")))
      .hexSideColor((d: any) => mhiColor(avg(d.points, "mhi")))
      .hexLabel((d: any) => `MHI ${avg(d.points, "mhi").toFixed(0)} · ${d.points.length} cells`);

    globeRef.current = globe;
    const controls = globe.controls() as any;
    if (controls) {
      controls.autoRotate = rotating;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = true;
      controls.minDistance = 180;
    }

    const handleResize = () => {
      if (containerRef.current) globe.width(containerRef.current.clientWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) containerRef.current.innerHTML = "";
      globeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-bin on week / data change
  useEffect(() => {
    if (globeRef.current) globeRef.current.hexBinPointsData(binPoints);
  }, [binPoints]);

  // Toggle rotation
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls() as any;
    if (controls) controls.autoRotate = rotating;
  }, [rotating]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl"
      style={{ height, background: "radial-gradient(circle at 50% 38%, #0d2338 0%, #071522 55%, #030a12 100%)" }}
    />
  );
}
