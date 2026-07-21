// Background boundary watch — native-app counterpart of the foreground
// geofence in app/page.tsx. Uses a foreground-service location watcher
// (@capacitor-community/background-geolocation) so the fisher still gets a
// no-go-zone warning with the screen off or the app in the background, plus
// local notifications that fire outside the webview.
//
// Web builds: startBoundaryWatch() is a no-op (page.tsx's watchPosition
// geofence keeps covering the foreground case there).

import { registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { haversineKm } from "./geo";
import { isNativeApp } from "./native";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

export interface BoundaryZone {
  lat: number;
  lon: number;
}

export interface BoundaryWatchStrings {
  /** Persistent Android notification while the watcher runs. */
  trackingTitle: string;
  trackingMessage: string;
  /** Alert notification fired on entering the danger radius. */
  alertTitle: string;
  alertBody: (km: string) => string;
}

export const GEOFENCE_RADIUS_KM = 8;

// Re-arm the alert only after moving well clear of the radius, so GPS jitter
// on the 8 km line doesn't spam notifications.
const REARM_KM = GEOFENCE_RADIUS_KM + 1.5;

const PREF_KEY = "oceanmind_boundary_watch";

let watcherId: string | null = null;
const listeners = new Set<(active: boolean) => void>();

function notifyListeners() {
  const active = watcherId !== null;
  listeners.forEach((fn) => fn(active));
}

/** Subscribe to watcher on/off changes (for UI state). Returns unsubscribe. */
export function onBoundaryWatchChange(fn: (active: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isBoundaryWatchActive = () => watcherId !== null;

/** Whether the fisher had the watch enabled last session (to auto-resume). */
export const boundaryWatchPreferred = () =>
  typeof localStorage !== "undefined" && localStorage.getItem(PREF_KEY) === "1";

async function fireAlert(strings: BoundaryWatchStrings, km: number) {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 2147483647,
          title: strings.alertTitle,
          body: strings.alertBody(km.toFixed(1)),
        },
      ],
    });
  } catch {
    // Notification failure must never kill the watcher callback.
  }
}

/**
 * Start watching the fisher's position against RED (no-go) zones.
 * Resolves once the watcher is registered. onPermissionDenied fires if the
 * user refuses background location — the watch is stopped in that case.
 */
export async function startBoundaryWatch(
  zones: BoundaryZone[],
  strings: BoundaryWatchStrings,
  onPermissionDenied?: () => void
): Promise<void> {
  if (!isNativeApp() || watcherId !== null || zones.length === 0) return;

  // Android 13+ needs POST_NOTIFICATIONS before the foreground-service
  // notification (and our alerts) can show.
  try {
    await LocalNotifications.requestPermissions();
  } catch {
    /* keep going — location alerts in-app still work */
  }

  let inside = false;

  const id = await BackgroundGeolocation.addWatcher(
    {
      backgroundTitle: strings.trackingTitle,
      backgroundMessage: strings.trackingMessage,
      requestPermissions: true,
      stale: false,
      distanceFilter: 100, // metres between updates — battery-friendly at sea
    },
    (location, error) => {
      if (error) {
        if (error.code === "NOT_AUTHORIZED") {
          stopBoundaryWatch();
          onPermissionDenied?.();
        }
        return;
      }
      if (!location) return;

      const nearestKm = zones.reduce(
        (min, z) => Math.min(min, haversineKm(location.latitude, location.longitude, z.lat, z.lon)),
        Infinity
      );

      if (nearestKm < GEOFENCE_RADIUS_KM && !inside) {
        inside = true;
        fireAlert(strings, nearestKm);
      } else if (nearestKm > REARM_KM && inside) {
        inside = false;
      }
    }
  );

  watcherId = id;
  localStorage.setItem(PREF_KEY, "1");
  notifyListeners();
}

export async function stopBoundaryWatch(forgetPreference = true): Promise<void> {
  if (watcherId === null) return;
  const id = watcherId;
  watcherId = null;
  if (forgetPreference) localStorage.setItem(PREF_KEY, "0");
  notifyListeners();
  try {
    await BackgroundGeolocation.removeWatcher({ id });
  } catch {
    /* already gone */
  }
}

/** Deep-link to the app's settings page (for re-granting location). */
export function openLocationSettings() {
  BackgroundGeolocation.openSettings();
}
