"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ProfilePoint {
  lat: number;
  lon: number;
  mhi: number;
  stress: string;
}

interface Props {
  points: ProfilePoint[];
  height?: number;
}

function stressColor(stress: string): THREE.Color {
  switch (stress) {
    case "CRITICAL": return new THREE.Color("#e05545");
    case "WARNING":  return new THREE.Color("#e8a830");
    case "WATCH":    return new THREE.Color("#e0a050");
    default:         return new THREE.Color("#44b078");
  }
}

export default function OceanProfile3D({ points, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = height;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#060e1a");

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
    camera.position.set(0, 22, 35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.maxPolarAngle = Math.PI * 0.65;
    controls.minDistance = 12;
    controls.maxDistance = 60;

    // Lighting
    scene.add(new THREE.AmbientLight(0x88aacc, 0.5));
    const sun = new THREE.DirectionalLight(0xfff0dd, 1.0);
    sun.position.set(15, 25, 15);
    sun.castShadow = true;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4488bb, 0.3);
    fill.position.set(-10, 8, -10);
    scene.add(fill);
    const rim = new THREE.PointLight(0x4fc3f7, 0.4, 50);
    rim.position.set(0, -5, 0);
    scene.add(rim);

    // Normalize lat/lon to scene coords — place points following India's shape
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    const latRange = latMax - latMin || 1;
    const lonRange = lonMax - lonMin || 1;
    const scaleX = 24;
    const scaleZ = 18;

    const toScene = (lat: number, lon: number) => ({
      x: ((lon - lonMin) / lonRange - 0.5) * scaleX,
      z: -((lat - latMin) / latRange - 0.5) * scaleZ,
    });

    // Ocean floor
    const oceanGeo = new THREE.CircleGeometry(20, 64);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0a1830, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.05;
    scene.add(ocean);

    // Water surface (animated)
    const waterGeo = new THREE.PlaneGeometry(40, 40, 40, 40);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a5070, transparent: true, opacity: 0.12,
      side: THREE.DoubleSide, wireframe: false,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 8.5;
    scene.add(water);

    // Subtle grid on floor
    const grid = new THREE.GridHelper(30, 30, 0x152535, 0x101e2e);
    grid.position.y = -0.02;
    scene.add(grid);

    // Build columns — each point becomes a glowing pillar
    const group = new THREE.Group();
    const sorted = [...points].sort((a, b) => a.lon - b.lon || a.lat - b.lat);

    sorted.forEach((pt) => {
      const { x, z } = toScene(pt.lat, pt.lon);
      const mhiNorm = pt.mhi / 100;
      const colHeight = 0.5 + mhiNorm * 7.5; // min 0.5, max 8
      const color = stressColor(pt.stress);

      // Pillar
      const radius = 0.22;
      const geo = new THREE.CylinderGeometry(radius, radius * 1.15, colHeight, 8);
      const mat = new THREE.MeshStandardMaterial({
        color, transparent: true, opacity: 0.88,
        emissive: color, emissiveIntensity: 0.2,
        metalness: 0.1, roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, colHeight / 2, z);
      mesh.castShadow = true;
      group.add(mesh);

      // Top cap glow
      const capGeo = new THREE.SphereGeometry(radius * 1.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.95,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, colHeight, z);
      group.add(cap);

      // Base ring
      const ringGeo = new THREE.RingGeometry(radius * 1.2, radius * 1.8, 8);
      const ringMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.02, z);
      group.add(ring);

      // Depth shadow line going down
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, -2 - (1 - mhiNorm) * 3, z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: color.clone(), transparent: true, opacity: 0.2 });
      group.add(new THREE.Line(lineGeo, lineMat));
    });

    scene.add(group);

    // Floating particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 30;
      pPositions[i * 3 + 1] = Math.random() * 10 - 2;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x4fc3f7, size: 0.06, transparent: true, opacity: 0.4 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Animate
    let animId = 0;
    function animate() {
      animId = requestAnimationFrame(animate);
      controls.update();
      const t = Date.now() * 0.001;

      // Gentle water wave
      water.position.y = 8.5 + Math.sin(t * 0.4) * 0.08;

      // Float particles upward
      const pos = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += 0.003;
        if (pos[i * 3 + 1] > 10) pos[i * 3 + 1] = -2;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const nw = container.clientWidth;
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [points, height]);

  return (
    <div ref={containerRef} className="rounded-2xl overflow-hidden" style={{ height, background: "#060e1a" }} />
  );
}
