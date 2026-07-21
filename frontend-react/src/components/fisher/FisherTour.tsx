"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

// A first-run preview of what the app does, in plain language. Rows that live on
// the Fisher home just close the sheet; the rest deep-link to their page so the
// fisher can try a feature straight from the tour instead of hunting for it.
const CAPS: { key: string; icon: string; color: string; href?: string }[] = [
  { key: "verdict", icon: "ph-fill ph-cloud-sun",    color: "#2f6f4c" },
  { key: "zones",   icon: "ph-fill ph-compass",      color: "#1f7a8c" },
  { key: "rules",   icon: "ph-fill ph-scales",       color: "#6a3b8f" },
  { key: "safety",  icon: "ph-fill ph-lifebuoy",     color: "#c0772f" },
  { key: "catch",   icon: "ph-fill ph-fish-simple",  color: "#2a6f7c", href: "/community" },
  { key: "scan",    icon: "ph-fill ph-camera",       color: "#b8792f", href: "/biodiversity" },
  { key: "voice",   icon: "ph-fill ph-microphone",   color: "#b0552f", href: "/voice" },
];

export default function FisherTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  // Portal to <body> so the sheet escapes the page's animate-page-enter transform.
  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center sm:p-4 bg-black/45 backdrop-blur-sm animate-page-enter"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ boxShadow: "0 -8px 40px rgba(23,48,57,0.25)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#f0ebdf]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-accent mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <i className="ph-fill ph-sparkle" /> {t("tour.badge")}
              </div>
              <h2 className="text-[21px] font-semibold text-text leading-tight" style={{ fontFamily: "'Newsreader', serif" }}>{t("tour.title")}</h2>
              <p className="text-[12.5px] text-text-muted mt-1">{t("tour.subtitle")}</p>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="flex-none w-9 h-9 rounded-full bg-card-hover text-text-muted hover:text-text flex items-center justify-center text-lg leading-none">
              &times;
            </button>
          </div>
        </div>

        {/* Capabilities */}
        <div className="px-4 py-3 space-y-1 overflow-y-auto">
          {CAPS.map((c) => {
            const inner = (
              <>
                <span className="w-11 h-11 flex-none rounded-xl flex items-center justify-center" style={{ background: c.color + "15", color: c.color }}>
                  <i className={c.icon} style={{ fontSize: 22 }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold text-text">{t(`tour.${c.key}.t`)}</div>
                  <div className="text-[12px] text-text-muted leading-snug mt-0.5">{t(`tour.${c.key}.d`)}</div>
                </div>
                {c.href && <i className="ph ph-arrow-right text-[15px] text-text-faint flex-none self-center" />}
              </>
            );
            const cls = "w-full flex items-center gap-3.5 text-left rounded-2xl p-3 hover:bg-card-hover transition-colors";
            return c.href
              ? <a key={c.key} href={c.href} onClick={onClose} className={cls}>{inner}</a>
              : <button key={c.key} onClick={onClose} className={cls}>{inner}</button>;
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pt-3 pb-6 border-t border-[#f0ebdf]">
          <button onClick={onClose} className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-3.5 font-semibold transition-colors">
            {t("tour.cta")}
          </button>
          <p className="text-center text-[11px] text-text-faint mt-2.5">{t("tour.footer")}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
