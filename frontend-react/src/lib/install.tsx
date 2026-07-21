"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Chrome's install event isn't in the standard DOM typings.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag when launched from the home screen
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

interface InstallState {
  canInstall: boolean;   // a deferred prompt is available right now
  isIos: boolean;        // iOS never fires the event — needs manual steps
  installed: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

const InstallCtx = createContext<InstallState>({
  canInstall: false, isIos: false, installed: false,
  promptInstall: async () => "unavailable",
});

export const useInstall = () => useContext(InstallCtx);

/**
 * Holds the deferred beforeinstallprompt event for the whole app, so both the
 * one-time banner and the always-available "Install app" button can trigger it.
 * The event is captured unconditionally — dismissing the banner must not throw
 * away the only chance to install.
 */
export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => { e.preventDefault(); setEvent(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setEvent(null); setInstalled(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!event) return "unavailable" as const;
    await event.prompt();
    const { outcome } = await event.userChoice;
    // The browser won't let the same event be reused; it re-fires on a later
    // visit if the user didn't install.
    setEvent(null);
    return outcome;
  }, [event]);

  return (
    <InstallCtx.Provider value={{ canInstall: !!event, isIos, installed, promptInstall }}>
      {children}
    </InstallCtx.Provider>
  );
}
