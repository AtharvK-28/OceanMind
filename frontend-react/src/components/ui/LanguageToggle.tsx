"use client";
import { useI18n, LANGS } from "@/lib/i18n";

export default function LanguageToggle({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { lang, setLang } = useI18n();
  const dark = variant === "dark";
  return (
    <div
      className={`inline-flex items-center rounded-lg border p-0.5 ${
        dark ? "border-white/15 bg-white/5" : "border-card-border bg-card-hover"
      }`}
      role="group"
      aria-label="Language"
    >
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className="px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors"
          style={{
            background: lang === l.code ? "#1f7a8c" : "transparent",
            color: lang === l.code ? "white" : dark ? "rgba(220,235,233,0.7)" : "#6d7e80",
          }}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}
