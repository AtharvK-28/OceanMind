import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.oceanmind.app",
  appName: "OceanMind",
  // Built by `npm run build:native` (CAPACITOR_BUILD=1 next build → static export).
  webDir: "out",
  android: {
    // Lets the webview call an http:// LAN backend while the API isn't deployed yet.
    allowMixedContent: true,
    // Required by @capacitor-community/background-geolocation: without the
    // legacy bridge, Android halts webview location callbacks after ~5 min
    // in the background (plugin README / issue #89).
    useLegacyBridge: true,
  },
};

export default config;
