"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { usePersona } from "@/lib/persona";
import { useInstall } from "@/lib/install";

const DISMISS_KEY = "oceanmind_install_dismissed";
const DISMISS_DAYS = 7;

function recentlyDismissed() {
  const ts = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function InstallPrompt() {
  const { t } = useI18n();
  const { persona, ready } = usePersona();
  // The deferred event now lives in InstallProvider, so dismissing this banner
  // no longer discards it — the always-on InstallButton can still trigger it.
  const { canInstall, isIos, installed, promptInstall } = useInstall();
  const [dismissed, setDismissed] = useState(false);
  const [snoozed, setSnoozed] = useState(true);

  // Read the snooze after mount to keep server and client render in agreement.
  useEffect(() => { setSnoozed(recentlyDismissed()); }, []);

  // Wait for the persona gate so the nudge never covers the first-run chooser.
  if (!ready || persona === null || dismissed || snoozed || installed) return null;
  if (!canInstall && !isIos) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const install = async () => {
    await promptInstall();
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
          {canInstall ? t("pwa.installDesc") : t("pwa.iosHint")}
        </p>
        <div className="flex gap-2 mt-2.5">
          {canInstall && (
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
