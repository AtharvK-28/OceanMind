"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { isNativeApp } from "@/lib/native";
import {
  startBoundaryWatch,
  stopBoundaryWatch,
  isBoundaryWatchActive,
  onBoundaryWatchChange,
  boundaryWatchPreferred,
  openLocationSettings,
  type BoundaryZone,
  type BoundaryWatchStrings,
} from "@/lib/geofence";

// Native-app only: toggle for the foreground-service boundary watch. On the
// web build this renders nothing — the in-page watchPosition geofence covers
// the foreground case there.
export default function BoundaryAlertsToggle({ zones }: { zones: BoundaryZone[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const autoResumed = useRef(false);

  const strings = (): BoundaryWatchStrings => ({
    trackingTitle: t("bg.trackTitle"),
    trackingMessage: t("bg.trackMsg"),
    alertTitle: t("bg.alertTitle"),
    alertBody: (km) => t("geofence.warning", { km }),
  });

  const onDenied = () => toast(t("bg.denied"), "error");

  useEffect(() => {
    setActive(isBoundaryWatchActive());
    return onBoundaryWatchChange(setActive);
  }, []);

  // Resume automatically if the fisher had alerts on last session — the watch
  // dies with the app process, so this brings it back on next launch.
  useEffect(() => {
    if (!isNativeApp() || autoResumed.current || zones.length === 0) return;
    autoResumed.current = true;
    if (boundaryWatchPreferred() && !isBoundaryWatchActive()) {
      startBoundaryWatch(zones, strings(), onDenied).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  if (!isNativeApp()) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (active) {
        await stopBoundaryWatch();
      } else {
        await startBoundaryWatch(zones, strings(), onDenied);
      }
    } catch {
      toast(t("bg.denied"), "error");
      openLocationSettings();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-card-border bg-white p-4 flex items-center gap-3.5">
      <i
        className={`ph-fill ph-radar text-[28px] flex-none ${active ? "animate-pulse" : ""}`}
        style={{ color: active ? "#2f6f4c" : "#7a8a8a" }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold leading-tight text-[#16323a]">{t("bg.title")}</div>
        <div className="text-[12px] mt-0.5 text-text-faint">
          {active ? t("bg.on") : t("bg.desc")}
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={busy || zones.length === 0}
        className={`flex-none text-[13px] font-semibold rounded-xl px-4 py-2 transition border ${
          active
            ? "bg-[#eaf3ef] text-[#2f6f4c] border-[#cfe6dd]"
            : "bg-[#16434c] text-white border-transparent"
        } disabled:opacity-50`}
      >
        {busy ? "…" : active ? t("bg.disable") : t("bg.enable")}
      </button>
    </div>
  );
}
