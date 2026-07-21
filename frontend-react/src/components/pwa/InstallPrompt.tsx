"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { usePersona } from "@/lib/persona";

// Chrome's install event isn't in the standard DOM typings.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "oceanmind_install_dismissed";
const DISMISS_DAYS = 7;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag when launched from the home screen
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed() {
  const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function InstallPrompt() {
  const { t } = useI18n();
  const { persona, ready } = usePersona();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — show manual instructions instead.
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) setShowIosHint(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Wait for the persona gate so the nudge never covers the first-run chooser.
  if (!ready || persona === null || dismissed) return null;
  if (!installEvent && !showIosHint) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    // Either way the browser won't allow re-prompting this event again.
    setInstallEvent(null);
    dismiss();
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-20 sm:right-auto sm:max-w-sm z-[60] rounded-xl bg-[#16434c] text-[#f1ece1] p-4 flex gap-3 items-start"
      style={{ boxShadow: "0 6px 20px rgba(18,50,57,0.35)" }}
    >
      <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-lg shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug">{t("pwa.installTitle")}</p>
        <p className="text-xs opacity-85 mt-0.5 leading-snug">
          {installEvent ? t("pwa.installDesc") : t("pwa.iosHint")}
        </p>
        <div className="flex gap-2 mt-2.5">
          {installEvent && (
            <button
              onClick={install}
              className="text-xs font-semibold bg-[#e0a94f] text-[#16323a] rounded-md px-3 py-1.5 hover:brightness-105 active:scale-95 transition"
            >
              {t("pwa.installBtn")}
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-xs font-medium opacity-80 hover:opacity-100 px-2 py-1.5"
          >
            {t("pwa.installLater")}
          </button>
        </div>
      </div>
    </div>
  );
}
