export function mhiColor(score: number): string {
  if (score < 25) return "#c25a44";
  if (score < 50) return "#d49a2e";
  if (score < 65) return "#d98b4a";
  return "#3a8c5f";
}

export function sfzColor(zone: string): string {
  return { GREEN: "#3a8c5f", AMBER: "#d49a2e", RED: "#c25a44" }[zone] ?? "#8a9698";
}

export function sfzFoliumColor(zone: string): string {
  return { GREEN: "#3a8c5f", AMBER: "#d49a2e", RED: "#c25a44" }[zone] ?? "#8a9698";
}

export function stressColor(level: string): string {
  return { CRITICAL: "#c25a44", WARNING: "#d49a2e", WATCH: "#d98b4a", NORMAL: "#3a8c5f" }[level] ?? "#8a9698";
}

export function migrationColor(prob: number): string {
  if (prob < 0.2) return "#0e2d34";
  if (prob < 0.4) return "#15434c";
  if (prob < 0.6) return "#1f7a8c";
  if (prob < 0.8) return "#3a8c5f";
  return "#6fd29a";
}
