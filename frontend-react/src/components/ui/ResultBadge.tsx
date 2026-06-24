export default function ResultBadge({ label, color, size = "sm" }: { label: string; color: string; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "px-4 py-2 text-base font-bold" : "px-2.5 py-1 text-xs font-semibold";
  return (
    <span className={`inline-block rounded-full ${sizeClass}`} style={{ backgroundColor: color + "25", color, border: `1px solid ${color}40` }}>
      {label}
    </span>
  );
}
