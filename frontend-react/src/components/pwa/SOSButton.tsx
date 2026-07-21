"use client";
import { useState } from "react";
import { sendSosWithLocation } from "@/lib/sos";
import { usePersona } from "@/lib/persona";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

export default function SOSButton() {
  const [sending, setSending] = useState(false);
  const { persona } = usePersona();
  const { toast } = useToast();
  const { t } = useI18n();

  // The SOS button is an at-sea safety tool. Hide it in the researcher console,
  // where it only clutters the desktop analytics views. Shown to fishers and to
  // undecided first-time visitors.
  if (persona === "researcher") return null;

  function handleSOS() {
    setSending(true);
    sendSosWithLocation(undefined, () => toast(t("sos.sent"), "success"));
    // The SMS app takes over; reset the spinner shortly after.
    setTimeout(() => setSending(false), 1200);
  }

  return (
    <button
      onClick={handleSOS}
      disabled={sending}
      aria-label="Send SOS with my location via SMS"
      title="Send SOS with my location via SMS"
      className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-[#c0392b] hover:bg-[#a93226]
                 text-white flex items-center justify-center transition-transform
                 hover:scale-105 active:scale-95 disabled:opacity-60"
      style={{ boxShadow: "0 4px 14px rgba(192,57,43,0.4)" }}
    >
      {sending ? (
        <span className="text-[9px] font-bold">GPS…</span>
      ) : (
        <span className="flex flex-col items-center leading-none">
          <i className="ph-fill ph-siren text-[19px]" />
          <span className="text-[8px] font-bold mt-0.5 tracking-wide">SOS</span>
        </span>
      )}
    </button>
  );
}
