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
        <MetricCard label="Total Blocks" value={chain?.total_blocks ?? 0} />
        <MetricCard label="Catch Records" value={chain?.total_catch_records ?? 0} />
        <MetricCard label="Species Logged" value={chain?.species_logged?.length ?? 0} />
        <MetricCard label="Ledger Type" value="SHA-256 Mock" />
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
