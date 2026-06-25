const PRESETS: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  GREEN:   { bg: "#eaf3ef", border: "#cfe6dd", dot: "#3a8c5f", text: "#2f6f4c" },
  AMBER:   { bg: "#f7efdb", border: "#ecddb8", dot: "#d49a2e", text: "#8f6516" },
  RED:     { bg: "#f6e6e1", border: "#e8cabf", dot: "#c25a44", text: "#9d3c29" },
  NORMAL:  { bg: "#eaf3ef", border: "#cfe6dd", dot: "#3a8c5f", text: "#2f6f4c" },
  WARNING: { bg: "#f7efdb", border: "#ecddb8", dot: "#d49a2e", text: "#8f6516" },
  WATCH:   { bg: "#f7efdb", border: "#ecddb8", dot: "#d49a2e", text: "#8f6516" },
  CRITICAL:{ bg: "#f6e6e1", border: "#e8cabf", dot: "#c25a44", text: "#9d3c29" },
};

export default function ResultBadge({ label, color, size = "sm" }: { label: string; color: string; size?: "sm" | "lg" }) {
  const preset = PRESETS[label.toUpperCase()] || PRESETS[color.toUpperCase()];
  const sizeClass = size === "lg" ? "px-4 py-2 text-base font-bold" : "px-3 py-1 text-xs font-semibold";

  if (preset) {
    return (
      <span className={`inline-flex items-center gap-[6px] rounded-full ${sizeClass}`}
            style={{ backgroundColor: preset.bg, color: preset.text, border: `1px solid ${preset.border}` }}>
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: preset.dot }} />
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-block rounded-full ${sizeClass}`}
          style={{ backgroundColor: color + "20", color, border: `1px solid ${color}40` }}>
      {label}
    </span>
  );
}
