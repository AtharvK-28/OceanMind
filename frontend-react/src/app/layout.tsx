import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OceanMind — Marine Intelligence",
  description: "AI-Driven Unified Marine Data Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen flex">
        <ToastProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 pt-16 lg:pt-6">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
