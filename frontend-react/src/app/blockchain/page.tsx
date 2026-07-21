"use client";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher, apiGet, apiPost } from "@/lib/api";
import { SPECIES_OPTIONS, LANDING_SITES } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import TabGroup from "@/components/ui/TabGroup";
import DataTable from "@/components/ui/DataTable";
import LedgerFeed from "@/components/ui/LedgerFeed";
import QrCode from "@/components/ui/QrCode";
import type { CatchTraceResponse, ChainSummaryResponse, CatchRecord, CVAnalyzeResponse } from "@/types/api";

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

  // Photo → AI species ID
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detected, setDetected] = useState<{ common: string; sci: string; aphia: number; confidence: number } | null>(null);
  // Resolved after mount so server and first client render agree (avoids a
  // hydration mismatch); an empty base still gives a valid relative link.
  const [base, setBase] = useState("");
  useEffect(() => setBase(window.location.origin), []);

  function handleCatchPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setAnalyzing(true); setDetected(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = (reader.result as string).split(",")[1];
        const res = await apiPost<CVAnalyzeResponse>("/api/v1/cv/analyze", {
          site_lat: catchForm.latitude, site_lon: catchForm.longitude, image_base64: b64,
        });
        const id = res.identification;
        if (id) setDetected({ common: id.species_common, sci: id.species_scientific, aphia: id.aphia_id, confidence: id.confidence });
        else toast("No fish detected — try another photo or log manually.", "error");
      } catch { toast("Couldn't analyse the photo.", "error"); }
      finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setLogging(true);
    try {
      const res = await apiPost<CatchTraceResponse>("/api/v1/trace/catch", {
        species_aphia_id: detected ? detected.aphia : SPECIES_OPTIONS[catchForm.species],
        species_name: detected ? detected.common : catchForm.species.split(" (")[0],
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

  async function handleVerify(id?: string) {
    const tx = (id ?? txId).trim();
    if (!tx) return;
    setVerifyError("");
    try {
      const res = await apiGet<Record<string, unknown>>(`/api/v1/trace/verify/${tx}`);
      setVerifyResult(res);
    } catch { setVerifyError("Transaction not found."); setVerifyResult(null); }
  }

  // Jump straight from a just-logged catch to verifying it, so nobody has to
  // hand-copy a 64-character hash.
  function verifyLoggedCatch() {
    if (!catchResult) return;
    setTxId(catchResult.transaction_id);
    setTab("verify");
    handleVerify(catchResult.transaction_id);
  }

  // History
  const [historyFilter, setHistoryFilter] = useState("");
  const [history, setHistory] = useState<CatchRecord[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    const params: Record<string, string> = {};
    if (historyFilter.trim()) params.landing_site = historyFilter.trim();
    const res = await apiGet<{ records: CatchRecord[] }>("/api/v1/trace/history", params);
    setHistory(res.records);
    setHistoryLoaded(true);
  }, [historyFilter]);

  // Auto-load the full ledger the first time the History tab is opened, so it
  // isn't a blank table waiting on a manual "Load" click.
  useEffect(() => {
    if (tab === "history" && !historyLoaded) loadHistory();
  }, [tab, historyLoaded, loadHistory]);

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Catch Traceability Ledger"
        description="A mock in-memory SHA-256 hash chain — every logged catch is chained and verifiable. A production deployment would swap in <b>Hyperledger Fabric 2.5</b> for real distributed consensus."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Blocks" value={chain?.total_blocks ?? 0} icon="ph ph-cube" delta="SHA-256 hash chain" deltaColor="green" />
        <MetricCard label="Catch Records" value={chain?.total_catch_records ?? 0} icon="ph ph-fish-simple" delta="Verified on ledger" deltaColor="green" />
        <MetricCard label="Species Logged" value={chain?.species_logged?.length ?? 0} icon="ph ph-dna" delta={chain?.species_logged?.slice(0, 2).join(", ") ?? ""} deltaColor="green" />
        <MetricCard label="Ledger Type" value="Mock" icon="ph ph-shield-check" delta="Roadmap: Hyperledger Fabric" deltaColor="amber" />
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
          <LedgerFeed limit={5} />
          <p className="mt-3 pt-3 border-t border-[#f0ebdf] text-[10.5px] text-text-faint">
            Live from the in-memory SHA-256 chain. Log a catch below to append a new verified block.
          </p>
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
        <div className="max-w-2xl">
          {/* Photo → AI species ID: the model fills the species in for you */}
          <div className="mb-4 rounded-2xl border border-card-border bg-white p-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
            <div className="flex items-center gap-2 mb-3">
              <i className="ph-fill ph-camera text-[17px] text-accent" />
              <span className="text-[13px] font-semibold text-text">Snap a catch photo — the AI identifies the species for you</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="relative border-2 border-dashed border-[#d8cfbc] rounded-xl w-full sm:w-44 h-32 flex-none flex items-center justify-center hover:border-accent/40 transition-colors overflow-hidden">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Catch" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <i className="ph ph-camera text-[26px] text-text-muted" />
                    <p className="text-[11px] text-text-faint mt-1">Tap to add photo</p>
                  </div>
                )}
                <input type="file" accept="image/*" capture="environment" onChange={handleCatchPhoto}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="flex-1 min-w-0">
                {analyzing ? (
                  <div className="text-[13px] text-text-muted animate-pulse">Identifying species with the vision model…</div>
                ) : detected ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zone-green-bg text-[#2f6f4c] px-2.5 py-1 text-[11px] font-semibold mb-1.5">
                      <i className="ph-fill ph-check-circle text-[13px]" /> Identified · {(detected.confidence * 100).toFixed(0)}% confident
                    </span>
                    <div className="text-[15px] font-semibold text-text" style={{ fontFamily: "'Newsreader', serif" }}>{detected.common}</div>
                    <div className="text-[12px] text-text-muted italic">{detected.sci} · AphiaID {detected.aphia}</div>
                    <button type="button" onClick={() => { setDetected(null); setPhotoPreview(null); }}
                      className="text-[11px] text-accent hover:text-accent-dark mt-1">Clear &amp; choose manually</button>
                  </div>
                ) : (
                  <p className="text-[12.5px] text-text-muted">Add a photo of your catch and the Roboflow vision model identifies the species and fills it in below — no typing needed.</p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleLog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {detected ? (
            <div className="block">
              <span className="text-xs text-text-muted">Species (from photo)</span>
              <div className="w-full mt-1 bg-zone-green-bg border border-[#cfe6dd] rounded-lg px-3 py-2 text-sm text-text flex items-center gap-2">
                <i className="ph-fill ph-fish text-accent" /> {detected.common}
              </div>
            </div>
          ) : (
            <label className="block">
              <span className="text-xs text-text-muted">Species</span>
              <select value={catchForm.species} onChange={(e) => setCatchForm({ ...catchForm, species: e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text">
                {Object.keys(SPECIES_OPTIONS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
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
            {logging ? "Logging..." : detected ? `Log ${detected.common} to Ledger` : "Log Catch to Ledger"}
          </button>
          </form>
        </div>
      )}
      {tab === "log" && catchResult && (
        <div className="mt-4 bg-white border border-card-border rounded-xl p-5 max-w-2xl" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <i className="ph-fill ph-check-circle text-[20px] text-[#2f6f4c]" />
            <span className="text-[14px] font-semibold text-[#2f6f4c]">Catch logged to the ledger</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-card-hover border border-card-border p-3">
              <div className="text-[9px] uppercase tracking-wider text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Block</div>
              <div className="text-[18px] font-bold text-text mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>#{catchResult.block_number}</div>
            </div>
            <div className="rounded-lg bg-card-hover border border-card-border p-3">
              <div className="text-[9px] uppercase tracking-wider text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Status</div>
              <div className="text-[14px] font-semibold text-[#2f6f4c] mt-1">{catchResult.status}</div>
            </div>
            <div className="rounded-lg bg-card-hover border border-card-border p-3 col-span-2">
              <div className="text-[9px] uppercase tracking-wider text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Transaction ID</div>
              <div className="text-[12px] text-text mt-1 break-all" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{catchResult.transaction_id}</div>
            </div>
            <div className="rounded-lg bg-card-hover border border-card-border p-3 col-span-2">
              <div className="text-[9px] uppercase tracking-wider text-text-muted" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>PMMSY cert ref</div>
              <div className="text-[12px] text-text mt-1 break-all" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{catchResult.pmmsy_cert_ref}</div>
            </div>
          </div>
          {/* Catch-to-plate QR — closes the loop from log to consumer */}
          <div className="mt-4 pt-4 border-t border-[#f0ebdf] flex items-center gap-4">
            <a href={`${base}/trace?tx=${catchResult.transaction_id}`} target="_blank" rel="noreferrer" className="flex-none">
              <QrCode value={`${base}/trace?tx=${catchResult.transaction_id}`} size={76} />
            </a>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-text flex items-center gap-1.5"><i className="ph ph-qr-code text-[15px] text-accent" /> Catch-to-plate QR ready</div>
              <p className="text-[11.5px] text-text-muted mt-0.5 leading-snug">This catch now has a consumer-scannable provenance page — the fish&apos;s full journey from boat to plate.</p>
              <a href={`${base}/trace?tx=${catchResult.transaction_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] text-accent hover:text-accent-dark mt-1">
                View provenance page <i className="ph ph-arrow-up-right text-[12px]" />
              </a>
            </div>
          </div>

          <button onClick={verifyLoggedCatch}
            className="mt-4 w-full flex items-center justify-center gap-2 border border-card-border rounded-lg py-2.5 text-sm font-semibold text-accent hover:bg-card-hover transition-colors">
            <i className="ph ph-shield-check" style={{ fontSize: 16 }} /> Verify this catch on the ledger
          </button>
        </div>
      )}

      {tab === "verify" && (
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-3">
            <input type="text" value={txId} onChange={(e) => setTxId(e.target.value)}
              placeholder="Enter 64-character SHA-256 transaction ID..."
              className="flex-1 bg-card-hover border border-card-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-faint font-mono" />
            <button onClick={() => handleVerify()} disabled={!txId.trim()}
              className="px-6 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-40">
              Verify
            </button>
          </div>
          {verifyError && <p className="text-red-400 text-sm">{verifyError}</p>}
          {verifyResult && (
            <div className="bg-white border border-card-border rounded-xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <div className="flex items-center gap-2 mb-4">
                <i className="ph-fill ph-shield-check text-[20px] text-[#2f6f4c]" />
                <span className="text-[14px] font-semibold text-[#2f6f4c]">Transaction verified</span>
              </div>
              <div className="divide-y divide-[#f0ebdf]">
                {Object.entries(verifyResult).map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 py-2">
                    <span className="text-[11px] uppercase tracking-wider text-text-muted flex-none" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{k.replace(/_/g, " ")}</span>
                    <span className="text-[12.5px] text-text text-right break-all" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
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
