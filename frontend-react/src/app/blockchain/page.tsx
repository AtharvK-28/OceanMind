"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher, apiGet, apiPost } from "@/lib/api";
import { SPECIES_OPTIONS, LANDING_SITES } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import TabGroup from "@/components/ui/TabGroup";
import DataTable from "@/components/ui/DataTable";
import type { CatchTraceResponse, ChainSummaryResponse, CatchRecord } from "@/types/api";

export default function BlockchainPage() {
  const [tab, setTab] = useState("log");
  const { data: chain, mutate: refreshChain } = useSWR<ChainSummaryResponse>("/api/v1/trace/chain-summary", fetcher);
  const { toast } = useToast();

  // Log Catch
  const [catchForm, setCatchForm] = useState({
    species: Object.keys(SPECIES_OPTIONS)[0],
    quantity_kg: 100, latitude: 12.5, longitude: 74.8,
    site: Object.keys(LANDING_SITES)[0], fisher_token: "",
  });
  const [catchResult, setCatchResult] = useState<CatchTraceResponse | null>(null);
  const [logging, setLogging] = useState(false);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    try {
      const res = await apiPost<CatchTraceResponse>("/api/v1/trace/catch", {
        species_aphia_id: SPECIES_OPTIONS[catchForm.species],
        species_name: catchForm.species.split(" (")[0],
        quantity_kg: catchForm.quantity_kg,
        latitude: catchForm.latitude, longitude: catchForm.longitude,
        landing_site_id: LANDING_SITES[catchForm.site],
        fisher_token: catchForm.fisher_token || null,
      });
      setCatchResult(res);
      refreshChain();
      toast(`Catch logged — Block #${res.block_number}`, "success");
    } finally { setLogging(false); }
  }

  // Verify
  const [txId, setTxId] = useState("");
  const [verifyResult, setVerifyResult] = useState<Record<string, unknown> | null>(null);
  const [verifyError, setVerifyError] = useState("");

  async function handleVerify() {
    if (!txId.trim()) return;
    setVerifyError("");
    try {
      const res = await apiGet<Record<string, unknown>>(`/api/v1/trace/verify/${txId.trim()}`);
      setVerifyResult(res);
    } catch { setVerifyError("Transaction not found."); setVerifyResult(null); }
  }

  // History
  const [historyFilter, setHistoryFilter] = useState("");
  const [history, setHistory] = useState<CatchRecord[]>([]);

  async function loadHistory() {
    const params: Record<string, string> = {};
    if (historyFilter.trim()) params.landing_site = historyFilter.trim();
    const res = await apiGet<{ records: CatchRecord[] }>("/api/v1/trace/history", params);
    setHistory(res.records);
  }

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Catch Traceability Ledger"
        description="<b>Phase H MVP:</b> in-memory SHA-256 hash chain (mock ledger). Phase 2: replaces with <b>Hyperledger Fabric 2.5</b>."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Blocks" value={chain?.total_blocks ?? 0} icon="ph ph-cube" delta="SHA-256 hash chain" deltaColor="green" />
        <MetricCard label="Catch Records" value={chain?.total_catch_records ?? 0} icon="ph ph-fish-simple" delta="Verified on ledger" deltaColor="green" />
        <MetricCard label="Species Logged" value={chain?.species_logged?.length ?? 0} icon="ph ph-dna" delta={chain?.species_logged?.slice(0, 2).join(", ") ?? ""} deltaColor="green" />
        <MetricCard label="Ledger Type" value="Mock" icon="ph ph-shield-check" delta="Phase 2: Hyperledger Fabric" deltaColor="amber" />
      </div>

      {/* Recent activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 mb-6">
        <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="m-0 text-[16px] font-semibold text-text" style={{ fontFamily: "'Newsreader', serif" }}>Recent ledger activity</h3>
            <span className="inline-flex items-center gap-[5px] text-[10.5px] text-accent" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <i className="ph ph-shield-check text-[13px]" /> verified
            </span>
          </div>
          {[
            { species: "Indian Mackerel", site: "Veraval, GJ", time: "07:42", kg: "210 kg", hash: "0x9f3a…b2" },
            { species: "Oil Sardine", site: "Kochi, KL", time: "07:18", kg: "164 kg", hash: "0x41c8…7e" },
            { species: "Yellowfin Tuna", site: "Vizag, AP", time: "06:55", kg: "88 kg", hash: "0xa7d0…1f" },
            { species: "Giant Tiger Prawn", site: "Mangalore, KA", time: "06:31", kg: "52 kg", hash: "0x2be9…c4" },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-3 py-[11px] border-t border-[#f0ebdf]">
              <span className="w-[34px] h-[34px] flex-none rounded-[9px] bg-zone-green-bg text-accent flex items-center justify-center">
                <i className="ph ph-fish-simple text-[16px]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-text">{l.species}</div>
                <div className="text-[11px] text-text-muted">{l.site} · {l.time}</div>
              </div>
              <div className="text-right">
                <div className="text-[12.5px] text-text" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{l.kg}</div>
                <div className="text-[9.5px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{l.hash}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Species logged */}
        <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
          <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Species on ledger</h3>
          {(chain?.species_logged ?? ["Indian Mackerel", "Oil Sardine", "Yellowfin Tuna", "Giant Tiger Prawn"]).map((sp, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-t border-[#f0ebdf] first:border-0">
              <span className="w-7 h-7 flex-none rounded-lg bg-card-hover text-accent flex items-center justify-center">
                <i className="ph-fill ph-fish-simple text-[14px]" />
              </span>
              <span className="text-[13px] text-text">{sp}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-[#f0ebdf] text-[11px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Genesis: {chain?.genesis_hash?.slice(0, 16) ?? "—"}…
          </div>
        </div>
      </div>

      <TabGroup tabs={[
        { id: "log", label: "Log Catch" },
        { id: "verify", label: "Verify TX" },
        { id: "history", label: "History" },
      ]} activeTab={tab} onChange={setTab} />

      {tab === "log" && (
        <form onSubmit={handleLog} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <label className="block">
            <span className="text-xs text-text-muted">Species</span>
            <select value={catchForm.species} onChange={(e) => setCatchForm({ ...catchForm, species: e.target.value })}
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text">
              {Object.keys(SPECIES_OPTIONS).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Quantity (kg)</span>
            <input type="number" value={catchForm.quantity_kg} onChange={(e) => setCatchForm({ ...catchForm, quantity_kg: +e.target.value })}
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Landing Site</span>
            <select value={catchForm.site} onChange={(e) => setCatchForm({ ...catchForm, site: e.target.value })}
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text">
              {Object.keys(LANDING_SITES).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-text-muted">Fisher Token (optional)</span>
            <input type="text" value={catchForm.fisher_token} onChange={(e) => setCatchForm({ ...catchForm, fisher_token: e.target.value })}
              placeholder="e.g. FISHER_GJ_8821"
              className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint" />
          </label>
          <button type="submit" disabled={logging}
            className="col-span-1 md:col-span-2 bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
            {logging ? "Logging..." : "Log Catch to Ledger"}
          </button>
        </form>
      )}
      {tab === "log" && catchResult && (
        <div className="mt-4 bg-card-hover rounded-lg p-4 max-w-2xl">
          <p className="text-[#3a8c5f] font-medium mb-2">Catch logged successfully!</p>
          <pre className="text-xs text-text-muted overflow-x-auto">{JSON.stringify(catchResult, null, 2)}</pre>
        </div>
      )}

      {tab === "verify" && (
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-3">
            <input type="text" value={txId} onChange={(e) => setTxId(e.target.value)}
              placeholder="Enter 64-character SHA-256 transaction ID..."
              className="flex-1 bg-card-hover border border-card-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-faint font-mono" />
            <button onClick={handleVerify} disabled={!txId.trim()}
              className="px-6 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-40">
              Verify
            </button>
          </div>
          {verifyError && <p className="text-red-400 text-sm">{verifyError}</p>}
          {verifyResult && (
            <div className="bg-card-hover rounded-lg p-4">
              <p className="text-[#3a8c5f] font-medium mb-2">Transaction verified!</p>
              <pre className="text-xs text-text-muted overflow-x-auto">{JSON.stringify(verifyResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex gap-3 max-w-md">
            <input type="text" value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}
              placeholder="Filter by landing site (e.g. VERAVAL_GJ)"
              className="flex-1 bg-card-hover border border-card-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-faint" />
            <button onClick={loadHistory} className="px-6 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors">
              Load
            </button>
          </div>
          <DataTable
            columns={[
              { key: "transaction_id", label: "TX ID", truncate: 16 },
              { key: "species_name", label: "Species" },
              { key: "quantity_kg", label: "Qty (kg)" },
              { key: "landing_site_id", label: "Site" },
              { key: "pmmsy_cert_ref", label: "PMMSY Cert", truncate: 24 },
            ]}
            data={history}
            emptyMessage="No records. Click Load to fetch history."
            exportFilename="oceanmind_catch_history"
          />
        </div>
      )}
    </div>
  );
}
