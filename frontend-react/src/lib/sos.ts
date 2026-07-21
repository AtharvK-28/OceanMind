// Shared SOS helper. In the native Android app with an emergency contact
// configured, the distress SMS is sent directly via SmsManager (one tap, no
// composer). Everywhere else it opens the device SMS app pre-filled with the
// message + live GPS location — works on every phone, no backend needed.
// Set NEXT_PUBLIC_EMERGENCY_SMS_NUMBER to pre-address a coast guard /
// cooperative contact; otherwise the fisher picks a recipient.

import { isNativeApp, SosSms } from "./native";

export const EMERGENCY_CONTACT = process.env.NEXT_PUBLIC_EMERGENCY_SMS_NUMBER || "";

export function buildSosBody(coords: { lat: number; lon: number } | null, note?: string): string {
  const head = note || "SOS — need help.";
  return coords
    ? `${head} My location: https://maps.google.com/?q=${coords.lat},${coords.lon}`
    : `${head} Unable to get GPS location.`;
}

export function openSos(coords: { lat: number; lon: number } | null, note?: string) {
  const body = buildSosBody(coords, note);
  window.location.href = EMERGENCY_CONTACT
    ? `sms:${EMERGENCY_CONTACT}?body=${encodeURIComponent(body)}`
    : `sms:?body=${encodeURIComponent(body)}`;
}

async function deliverSos(
  coords: { lat: number; lon: number } | null,
  note: string | undefined,
  onDirectSend?: () => void
) {
  if (isNativeApp() && EMERGENCY_CONTACT) {
    try {
      await SosSms.send({ number: EMERGENCY_CONTACT, message: buildSosBody(coords, note) });
      onDirectSend?.();
      return;
    } catch {
      // Permission denied or send failure — fall through to the composer.
    }
  }
  openSos(coords, note);
}

/**
 * Grab current GPS (best-effort), then send the SOS. onDirectSend fires only
 * when the SMS went out silently via the native path — use it to confirm to
 * the fisher, since no composer appears in that case.
 */
export function sendSosWithLocation(note?: string, onDirectSend?: () => void) {
  if (!navigator.geolocation) {
    deliverSos(null, note, onDirectSend);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => deliverSos({ lat: pos.coords.latitude, lon: pos.coords.longitude }, note, onDirectSend),
    () => deliverSos(null, note, onDirectSend),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
