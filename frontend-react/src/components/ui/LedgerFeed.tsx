"use client";
import useSWR from "swr";
import { apiGet } from "@/lib/api";
import type { CatchRecord } from "@/types/api";

// Maps landing-site codes back to short display labels (reverse of LANDING_SITES).
const SITE_LABELS: Record<string, string> = {
  VERAVAL_GJ: "Veraval, GJ",
  KOCHI_KL: "Kochi, KL",
  CHENNAI_TN: "Chennai, TN",
  VIZAG_AP: "Vizag, AP",
  MANGALORE_KA: "Mangalore, KA",
};

function shortHash(tx: string) {
  if (!tx || tx.length < 10) return tx || "—";
  return `${tx.slice(0, 6)}…${tx.slice(-2)}`;
}

function shortTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const fetchHistory = (path: string) =>
  apiGet<{ records: CatchRecord[] }>(path).then((r) => r.records);

/**
 * Real catch-ledger activity feed — reads /api/v1/trace/history so the card
 * reflects the actual SHA-256 hash chain instead of hardcoded placeholder rows.
 */
export default function LedgerFeed({ limit = 4 }: { limit?: number }) {
  const { data, isLoading } = useSWR<CatchRecord[] | { records: CatchRecord[] }>(
    "/api/v1/trace/history",
    fetchHistory,
    { refreshInterval: 10000 }
  );

  // Other pages share this SWR key with a fetcher that returns the raw
  // { records } envelope rather than the unwrapped array. Whichever resolves
  // last wins the cache, so tolerate both shapes instead of crashing.
  const list: CatchRecord[] = Array.isArray(data) ? data : (data?.records ?? []);

  const records = list
    .slice()
    .sort((a, b) => b.block_number - a.block_number)
    .slice(0, limit);

  if (isLoading) {
    return <div className="py-6 text-center text-[12px] text-text-faint">Loading ledger…</div>;
  }

  if (records.length === 0) {
    return (
      <div className="py-6 text-center text-[12.5px] text-text-faint">
        No catches logged yet. Log one to see it appear on the chain.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {records.map((r) => (
        <div key={r.transaction_id} className="flex items-center gap-3 py-[11px] border-t border-[#f0ebdf] first:border-0">
          <span className="w-[34px] h-[34px] flex-none rounded-[9px] bg-zone-green-bg text-accent flex items-center justify-center">
            <i className="ph ph-fish-simple text-[16px]" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-text truncate">{r.species_name}</div>
            <div className="text-[11px] text-text-muted">
              {SITE_LABELS[r.landing_site_id] ?? r.landing_site_id} · {shortTime(r.event_timestamp)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12.5px] text-text" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{r.quantity_kg} kg</div>
            <div className="text-[9.5px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }} title={r.transaction_id}>{shortHash(r.transaction_id)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
