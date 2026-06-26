"use client";
import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeInstance } from "globe.gl";

export interface MigrationArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  label?: string;
}

export interface MigrationPoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
}

export interface GlobeControls {
  toggleRotation?: () => void;
}

interface Props {
  arcs: MigrationArc[];
  points: MigrationPoint[];
  height?: number;
  focusLat?: number;
  focusLng?: number;
  rotating?: boolean;
}

export default function MigrationGlobe({ arcs, points, height = 520, focusLat = 12, focusLng = 75, rotating = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const globe = new Globe(containerRef.current)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .width(containerRef.current.clientWidth)
      .height(height)
      .atmosphereColor("#9fe0d6")
      .atmosphereAltitude(0.2)
      .pointOfView({ lat: focusLat, lng: focusLng, altitude: 2.2 }, 0)
      .arcsData(arcs)
      .arcColor("color")
      .arcStroke(1.4)
      .arcDashLength(0.5)
      .arcDashGap(0.25)
      .arcDashAnimateTime(3000)
      .arcAltitude(0.06)
      .arcAltitudeAutoScale(0.12)
      .pointsData(points)
      .pointLat("lat")
      .pointLng("lng")
      .pointAltitude(0.01)
      .pointRadius("size")
      .pointColor("color")
      .pointLabel("label")
      .labelsData([]);

    globeRef.current = globe;
    setReady(true);

    const controls = globe.controls() as any;
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = true;
    }

    const handleResize = () => {
      if (containerRef.current) {
        globe.width(containerRef.current.clientWidth);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls() as any;
    if (controls) controls.autoRotate = rotating;
  }, [rotating]);

  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current
      .arcsData(arcs)
      .pointsData(points);
  }, [arcs, points]);

  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: focusLat, lng: focusLng, altitude: 2.2 }, 1200);
  }, [focusLat, focusLng]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden"
      style={{ height, background: "#0a1628" }}
    />
  );
}
