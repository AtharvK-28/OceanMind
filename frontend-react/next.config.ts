import type { NextConfig } from "next";

// CAPACITOR_BUILD=1 next build → static export into `out/`, which Capacitor
// wraps as the native Android app's webDir. Web dev/deploy flow is unchanged.
const nextConfig: NextConfig = {
  output: process.env.CAPACITOR_BUILD ? "export" : undefined,
  turbopack: { root: __dirname },
};

export default nextConfig;
