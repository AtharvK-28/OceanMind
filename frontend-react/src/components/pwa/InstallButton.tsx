"use client";
import { useInstall } from "@/lib/install";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

/**
 * Always-available install entry point, so dismissing the one-time banner
 * never leaves the user unable to install the app.
 * Renders nothing once installed or where installing isn't possible.
 */
export default function InstallButton({ variant = "bar" }: { variant?: "bar" | "sidebar" }) {
  const { canInstall, isIos, installed, promptInstall } = useInstall();
  const { t } = useI18n();
  const { toast } = useToast();

  if (installed || (!canInstall && !isIos)) return null;

  const onClick = async () => {
    if (isIos && !canInstall) { toast(t("pwa.iosHint"), "info"); return; }
    const outcome = await promptInstall();
    if (outcome === "accepted") toast(t("pwa.installTitle"), "success");
  };

  if (variant === "sidebar") {
    return (
      <button
        onClick={onClick}
        title={t("pwa.installDesc")}
        className="mx-4 mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.14] bg-white/[0.06] py-1.5 text-[11px] text-[#9fe0d6] hover:bg-white/[0.12] transition-colors"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        <i className="ph ph-download-simple text-[13px]" /> {t("pwa.installBtn")}
      </button>
    );
  }

  // Compact icon button for the mobile top bar.
  return (
    <button
      onClick={onClick}
      aria-label={t("pwa.installBtn")}
      title={t("pwa.installBtn")}
      className="flex-none inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/[0.14] text-[#9fe0d6] px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white/20 transition-colors"
    >
      <i className="ph ph-download-simple text-[14px]" />
      <span className="hidden sm:inline">{t("pwa.installBtn")}</span>
    </button>
  );
}
