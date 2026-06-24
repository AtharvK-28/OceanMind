export function mhiColor(score: number): string {
  if (score < 25) return "#d32f2f";
  if (score < 50) return "#f57c00";
  if (score < 65) return "#fbc02d";
  return "#388e3c";
}

export function sfzColor(zone: string): string {
  return { GREEN: "#388e3c", AMBER: "#f9a825", RED: "#c62828" }[zone] ?? "#9e9e9e";
}

export function sfzFoliumColor(zone: string): string {
  return { GREEN: "#4caf50", AMBER: "#ff9800", RED: "#f44336" }[zone] ?? "#9e9e9e";
}

export function stressColor(level: string): string {
  return { CRITICAL: "#d32f2f", WARNING: "#f57c00", WATCH: "#fbc02d", NORMAL: "#388e3c" }[level] ?? "#9e9e9e";
}

export function migrationColor(prob: number): string {
  if (prob < 0.2) return "#440154";
  if (prob < 0.4) return "#3b528b";
  if (prob < 0.6) return "#21918c";
  if (prob < 0.8) return "#5ec962";
  return "#fde725";
}
