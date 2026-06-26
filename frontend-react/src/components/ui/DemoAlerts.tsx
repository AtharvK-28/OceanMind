"use client";
import { useEffect, useRef } from "react";
import { useToast } from "./Toast";

const DEMO_ALERTS = [
  { msg: "Zone change: Veraval Bank → GREEN · Safe to fish", type: "success" as const, delay: 25000 },
  { msg: "SST anomaly: +0.6°C detected off Gulf of Mannar", type: "info" as const, delay: 55000 },
  { msg: "MHI alert: Paradip Shelf dropped below 40 · WARNING", type: "error" as const, delay: 85000 },
  { msg: "New catch logged: 164 kg Oil Sardine at Kochi, KL", type: "success" as const, delay: 115000 },
  { msg: "Zone change: Chennai Coast → AMBER · Fish with caution", type: "info" as const, delay: 145000 },
  { msg: "Fishing advisory: Calm seas off Mangalore · GO (score 82)", type: "success" as const, delay: 175000 },
];

export default function DemoAlerts() {
  const { toast } = useToast();
  const fired = useRef(new Set<number>());

  useEffect(() => {
    const timers = DEMO_ALERTS.map((alert, i) =>
      setTimeout(() => {
        if (!fired.current.has(i)) {
          fired.current.add(i);
          toast(alert.msg, alert.type);
        }
      }, alert.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [toast]);

  return null;
}
