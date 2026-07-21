import type { MetadataRoute } from "next";

// Required for the Capacitor static export build (output: "export").
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OceanMind — Marine Intelligence",
    short_name: "OceanMind",
    description: "AI-driven fishing zone advisories, weather, and marine health for Indian coastal fishers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1ece1",
    theme_color: "#16434c",
    orientation: "portrait-primary",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
