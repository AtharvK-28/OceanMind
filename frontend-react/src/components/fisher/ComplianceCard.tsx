"use client";
import useSWR from "swr";
import { apiGet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface ComplianceStatus {
  fishing_allowed: boolean;
  status: "OPEN" | "SEASONAL_BAN" | "NO_TAKE";
  headline: string;
  detail: string;
  protected_zone: { name: string; type: string } | null;
  next_change: { date: string; days: number; becomes: string } | null;
}

const STYLE: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  OPEN:         { color: "#2f6f4c", bg: "#eaf3ef", border: "#cfe6dd", icon: "ph-fill ph-seal-check" },
  SEASONAL_BAN: { color: "#9d3c29", bg: "#f6e6e1", border: "#e8cabf", icon: "ph-fill ph-prohibit" },
  NO_TAKE:      { color: "#6a3b8f", bg: "#efe7f6", border: "#d9c9ea", icon: "ph-fill ph-shield-warning" },
};

const fetcher = (path: string) => apiGet<ComplianceStatus>(path);

export default function ComplianceCard({ lat, lon }: { lat: number; lon: number }) {
  const { t } = useI18n();
  const { data } = useSWR<ComplianceStatus>(
    `/api/v1/compliance/status?lat=${lat}&lon=${lon}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  if (!data) {
    return (
      <div className="mb-4 rounded-2xl border border-card-border bg-white px-4 py-3 flex items-center gap-3 text-text-faint text-sm">
        <i className="ph ph-circle-notch animate-spin text-[16px]" /> {t("comp.checking")}
      </div>
    );
  }

  const s = STYLE[data.status] ?? STYLE.OPEN;
  const days = data.next_change?.days ?? 0;
  const headline = data.status === "OPEN" ? t("comp.open") : data.status === "SEASONAL_BAN" ? t("comp.ban") : t("comp.notake");
  const detail =
    data.status === "OPEN" ? t("comp.openDesc", { days })
    : data.status === "SEASONAL_BAN" ? t("comp.banDesc", { days })
    : `${data.protected_zone?.name ?? ""} — ${t("comp.notakeDesc")}`;

  return (
    <div className="mb-4 rounded-2xl border p-4 flex items-center gap-3.5"
         style={{ background: s.bg, borderColor: s.border }}>
      <i className={`${s.icon} text-[30px] flex-none`} style={{ color: s.color }} />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold leading-tight" style={{ color: s.color }}>{headline}</div>
        <div className="text-[12px] mt-0.5" style={{ color: s.color }}>{detail}</div>
        <div className="text-[10px] mt-1 opacity-70" style={{ color: s.color }}>{t("comp.advisory")}</div>
      </div>
    </div>
  );
}
