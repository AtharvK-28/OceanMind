"use client";
import { usePathname } from "next/navigation";
import { usePersona } from "@/lib/persona";
import { useI18n } from "@/lib/i18n";

// Public, QR-reachable routes that a non-user (e.g. a consumer scanning a
// package) can land on directly — these must never show app onboarding.
const PUBLIC_ROUTES = ["/trace"];

/**
 * First-run chooser: asks whether the visitor is a fisher or a researcher and
 * stores the answer. Only appears once (until they switch), and only after
 * localStorage has been read, so it never flashes on repeat visits or during SSR.
 */
export default function PersonaGate() {
  const { persona, ready, setPersona } = usePersona();
  const { t } = useI18n();
  const pathname = usePathname();

  if (!ready || persona || PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-page-enter">
      <div className="bg-white rounded-2xl max-w-md w-full p-7 text-center" style={{ boxShadow: "0 20px 60px rgba(23,48,57,0.3)" }}>
        <img src="/logo-mark.png" alt="" className="w-14 h-14 mx-auto mb-4" />
        <h2 className="text-[22px] font-semibold text-text" style={{ fontFamily: "'Newsreader', serif" }}>{t("persona.title")}</h2>
        <p className="text-[13px] text-text-muted mt-1 mb-6">{t("persona.subtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => setPersona("fisher")}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-card-border hover:border-accent hover:-translate-y-0.5 p-5 transition-all">
            <i className="ph-fill ph-sailboat text-[32px] text-accent" />
            <span className="text-[14px] font-semibold text-text">{t("persona.fisher")}</span>
            <span className="text-[11px] text-text-muted leading-snug">{t("persona.fisherDesc")}</span>
          </button>
          <button onClick={() => setPersona("researcher")}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-card-border hover:border-accent hover:-translate-y-0.5 p-5 transition-all">
            <i className="ph-fill ph-flask text-[32px] text-accent" />
            <span className="text-[14px] font-semibold text-text">{t("persona.researcher")}</span>
            <span className="text-[11px] text-text-muted leading-snug">{t("persona.researcherDesc")}</span>
          </button>
        </div>

        <button onClick={() => setPersona("researcher")}
          className="mt-4 text-[11.5px] text-text-faint hover:text-text-muted underline decoration-dotted underline-offset-2">
          {t("persona.skip")}
        </button>
      </div>
    </div>
  );
}
