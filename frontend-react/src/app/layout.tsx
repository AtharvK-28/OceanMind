import type { Metadata, Viewport } from "next";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import DemoAlerts from "@/components/ui/DemoAlerts";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import OfflineBanner from "@/components/pwa/OfflineBanner";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import SOSButton from "@/components/pwa/SOSButton";
import PersonaGate from "@/components/ui/PersonaGate";
import GuidedTour from "@/components/ui/GuidedTour";
import { LangProvider } from "@/lib/i18n";
import { PersonaProvider } from "@/lib/persona";
import "./globals.css";

export const metadata: Metadata = {
  title: "OceanMind — Marine Intelligence",
  description: "AI-Driven Unified Marine Data Intelligence Platform",
};

export const viewport: Viewport = {
  themeColor: "#16434c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" style={{ background: "#f1ece1" }}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="min-h-screen flex" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#f1ece1", color: "#16323a" }}>
        <ToastProvider>
          <LangProvider>
            <PersonaProvider>
              <ServiceWorkerRegister />
              <DemoAlerts />
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-6 pt-16 lg:pt-6 max-w-[1280px]">
                {children}
              </main>
              <SOSButton />
              <InstallPrompt />
              <OfflineBanner />
              <GuidedTour />
              <PersonaGate />
            </PersonaProvider>
          </LangProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
