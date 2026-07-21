import type { Metadata, Viewport } from "next";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "OceanMind — Marine Intelligence",
  description: "AI-Driven Unified Marine Data Intelligence Platform",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,      // Lower limit for dynamic scaling
  maximumScale: 5,      // Upper limit for dynamic scaling
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" style={{ background: "#f1ece1" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="min-h-screen flex" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#f1ece1", color: "#16323a" }}>
        <ToastProvider>

          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 lg:pt-6 max-w-[1280px]">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
