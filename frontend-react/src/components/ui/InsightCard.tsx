"use client";

interface InsightCardProps {
  severity: "good" | "watch" | "warning" | "critical";
  headline: string;      // one sentence, plain language, no jargon, no model names
  body?: string;         // optional 1-2 sentence elaboration
  icon?: string;         // ph-* icon class, defaults per severity
}

const SEVERITY_STYLE: Record<InsightCardProps["severity"], { color: string; bg: string; border: string; icon: string }> = {
  good:     { color: "#2f6f4c", bg: "#eaf3ef", border: "#cfe6dd", icon: "ph-fill ph-check-circle" },
  watch:    { color: "#8f6516", bg: "#f7efdb", border: "#ecddb8", icon: "ph ph-eye" },
  warning:  { color: "#b0651f", bg: "#faf0e2", border: "#efdcc0", icon: "ph ph-warning-circle" },
  critical: { color: "#9d3c29", bg: "#f6e6e1", border: "#e8cabf", icon: "ph-fill ph-warning" },
};

export default function InsightCard({ severity, headline, body, icon }: InsightCardProps) {
  const s = SEVERITY_STYLE[severity];
  return (
    <div className="rounded-2xl border p-5 flex gap-4 items-start"
         style={{ background: s.bg, borderColor: s.border }}>
      <span className="w-11 h-11 flex-none rounded-xl flex items-center justify-center"
            style={{ background: s.color + "18", color: s.color }}>
        <i className={icon || s.icon} style={{ fontSize: 22 }} />
      </span>
      <div className="min-w-0">
        <div className="text-[16.5px] font-semibold leading-snug" style={{ color: "#16323a", fontFamily: "'Newsreader', serif" }}>
          {headline}
        </div>
        {body && <p className="mt-1.5 mb-0 text-[13px] leading-[1.55]" style={{ color: "#52636a" }}>{body}</p>}
      </div>
    </div>
  );
}
