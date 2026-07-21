// Bridge to the Capacitor native shell. Every export here degrades safely on
// the plain web build: check isNativeApp() before calling plugin methods.

import { Capacitor, registerPlugin } from "@capacitor/core";

/** True when running inside the Capacitor Android/iOS shell (not the web PWA). */
export const isNativeApp = () => Capacitor.isNativePlatform();

// Custom plugin implemented in android/.../SosSmsPlugin.java — sends an SMS
// directly via SmsManager instead of opening the composer.
export interface SosSmsPlugin {
  send(options: { number: string; message: string }): Promise<{ sent: boolean }>;
}

export const SosSms = registerPlugin<SosSmsPlugin>("SosSms");
