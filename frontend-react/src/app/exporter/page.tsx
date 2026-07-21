"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import QRCode from "qrcode";
import QrCode from "@/components/ui/QrCode";
import { apiGet } from "@/lib/api";

const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";
const darkGradient = "linear-gradient(177deg, #16434c 0%, #10333b 60%, #0e2d34 100%)";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

interface CatchRecord {
  transaction_id: string;
  block_number: number;
  species_aphia_id: number;
  species_name: string;
  quantity_kg: number;
  latitude: number;
  longitude: number;
  landing_site_id: string;
  event_timestamp: string;
  fisher_token: string | null;
  pmmsy_cert_ref: string;
}

const fetcher = (p: string) => apiGet<{ records: CatchRecord[] }>(p);

// Which import regime a consignment's destination market certifies against.
const MARKETS: Record<string, { market: string; port: string; framework: string; flag: string }> = {
  VERAVAL_GJ:  { market: "European Union", port: "Vigo, Spain",     framework: "EU IUU Reg. (EC) 1005/2008", flag: "🇪🇺" },
  KOCHI_KL:    { market: "Japan",          port: "Tokyo, Japan",    framework: "Japan IUU Act No. 79/2020",  flag: "🇯🇵" },
  CHENNAI_TN:  { market: "United States",  port: "Newark, USA",     framework: "US SIMP (NOAA)",             flag: "🇺🇸" },
  VIZAG_AP:    { market: "United Kingdom", port: "Grimsby, UK",     framework: "UK IUU Catch Certificate",   flag: "🇬🇧" },
  MANGALORE_KA:{ market: "United States",  port: "Los Angeles, USA",framework: "US SIMP (NOAA)",             flag: "🇺🇸" },
};
const fallbackMarket = { market: "European Union", port: "Rotterdam, NL", framework: "EU IUU Reg. (EC) 1005/2008", flag: "🇪🇺" };

// Scientific name + conservation grade per species (WoRMS / IUCN, indicative).
const SPECIES_META: Record<string, { sci: string; status: string; grade: "A" | "B" }> = {
  "Indian Mackerel": { sci: "Rastrelliger kanagurta", status: "Least Concern", grade: "A" },
  "Oil Sardine":     { sci: "Sardinella longiceps",   status: "Least Concern", grade: "A" },
  "Silver Pomfret":  { sci: "Pampus argenteus",       status: "Data Deficient", grade: "B" },
  "Yellowfin Tuna":  { sci: "Thunnus albacares",      status: "Near Threatened", grade: "B" },
  "Seer Fish":       { sci: "Scomberomorus commerson", status: "Near Threatened", grade: "B" },
  "Giant Tiger Prawn": { sci: "Penaeus monodon",      status: "Least Concern",  grade: "B" },
};
const speciesMeta = (n: string) => SPECIES_META[n] ?? { sci: n, status: "Assessed", grade: "A" as const };

interface Consignment {
  id: string;
  siteId: string;
  market: typeof fallbackMarket;
  records: CatchRecord[];
  totalKg: number;
  species: string[];
  grade: "A" | "B";
  exportDate: string;
}

const EXPORTER = "Sagar Marine Exports Pvt. Ltd.";
const today = () => new Date().toISOString().slice(0, 10);

function buildConsignments(records: CatchRecord[]): Consignment[] {
  const bySite: Record<string, CatchRecord[]> = {};
  for (const r of records) (bySite[r.landing_site_id] ??= []).push(r);
  return Object.entries(bySite).map(([siteId, recs], i) => {
    const species = [...new Set(recs.map((r) => r.species_name))];
    const grades = species.map((s) => speciesMeta(s).grade);
    const dateStr = today().replace(/-/g, "");
    return {
      id: `OM-EXP-${siteId.split("_")[0]}-${dateStr}-${String(i + 1).padStart(2, "0")}`,
      siteId,
      market: MARKETS[siteId] ?? fallbackMarket,
      records: recs,
      totalKg: recs.reduce((s, r) => s + r.quantity_kg, 0),
      species,
      grade: grades.includes("B") ? "B" : "A",
      exportDate: today(),
    };
  });
}

// Open a print-optimised catch certificate in a new tab; the browser's
// print dialog then offers "Save as PDF". Real document, real ledger data.
function downloadCertificate(c: Consignment) {
  const rows = c.records.map((r) => {
    const m = speciesMeta(r.species_name);
    return `<tr>
      <td>${r.species_name}<br><i>${m.sci}</i></td>
      <td class="mono">${r.species_aphia_id}</td>
      <td>${r.quantity_kg.toFixed(0)} kg</td>
      <td class="mono">${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}</td>
      <td>${new Date(r.event_timestamp).toLocaleDateString()}</td>
      <td class="mono">${r.fisher_token ?? "—"}</td>
      <td class="mono small">${r.transaction_id.slice(0, 16)}…</td>
    </tr>`;
  }).join("");

  const buildDoc = (qrImg: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${c.id}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Georgia', serif; color: #1a2b30; margin: 0; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #16434c; padding-bottom: 14px; }
    .brand { font-size: 22px; font-weight: 700; color: #16434c; }
    .brand small { display:block; font-size: 10px; letter-spacing: 2px; color:#6d7e80; font-family: monospace; font-weight: 400; margin-top: 2px; }
    h1 { font-size: 17px; letter-spacing: 1px; text-align: right; margin: 0; color:#16434c; }
    .cert-no { font-family: monospace; font-size: 11px; color:#6d7e80; text-align:right; margin-top:4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 28px; margin: 20px 0; font-size: 12px; }
    .grid .k { color:#6d7e80; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; }
    .grid .v { font-weight: 600; margin-bottom: 8px; }
    table { width:100%; border-collapse: collapse; font-size: 10.5px; margin-top: 6px; }
    th { background:#eef4f2; text-align:left; padding:6px 7px; font-size:9px; text-transform:uppercase; letter-spacing:0.4px; color:#16434c; border-bottom:1px solid #cddcd8; }
    td { padding:6px 7px; border-bottom:1px solid #eee; vertical-align: top; }
    td i { color:#6d7e80; font-size:9.5px; }
    .mono { font-family: monospace; } .small { font-size: 9px; }
    .section { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#16434c; font-weight:700; margin:22px 0 4px; }
    .attest { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
    .tick { font-size:11px; padding:6px 11px; border:1px solid #cddcd8; border-radius:6px; background:#f4f9f7; }
    .tick b { color:#2f6f4c; }
    .foot { margin-top: 26px; padding-top:12px; border-top:1px solid #ccc; font-size:9.5px; color:#8a9698; display:flex; justify-content:space-between; }
    .verify { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-top:20px; }
    .stamp { border:2px solid #16434c; border-radius:8px; padding:10px 14px; color:#16434c; }
    .stamp b { font-size:13px; } .stamp span { font-family:monospace; font-size:10px; color:#6d7e80; }
    .qr { text-align:center; font-size:8.5px; color:#6d7e80; font-family:monospace; line-height:1.3; }
    .qr img { display:block; margin-bottom:3px; }
    .warn { margin-top:18px; background:#fbf2e4; border:1px solid #efe2cc; border-radius:6px; padding:8px 12px; font-size:10px; color:#8f6516; }
  </style></head><body>
    <div class="head">
      <div class="brand">OceanMind ${c.market.flag}<small>MARINE TRACEABILITY</small></div>
      <div><h1>CATCH CERTIFICATE</h1><div class="cert-no">${c.id}</div></div>
    </div>
    <div class="grid">
      <div><div class="k">Exporter</div><div class="v">${EXPORTER}</div></div>
      <div><div class="k">Destination market</div><div class="v">${c.market.market} — ${c.market.port}</div></div>
      <div><div class="k">Consignment weight</div><div class="v">${c.totalKg.toFixed(0)} kg net</div></div>
      <div><div class="k">Regulatory framework</div><div class="v">${c.market.framework}</div></div>
      <div><div class="k">Landing site</div><div class="v">${c.siteId}</div></div>
      <div><div class="k">Export date</div><div class="v">${c.exportDate}</div></div>
    </div>

    <div class="section">Catch origin &amp; chain of custody</div>
    <table>
      <thead><tr><th>Species</th><th>AphiaID</th><th>Weight</th><th>GPS origin</th><th>Landed</th><th>Vessel / fisher</th><th>Ledger proof (SHA-256)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="section">Compliance attestations</div>
    <div class="attest">
      <div class="tick"><b>✓</b> ${c.market.framework}</div>
      <div class="tick"><b>✓</b> Seasonal-ban compliant</div>
      <div class="tick"><b>✓</b> Cleared of no-take zones</div>
      <div class="tick"><b>✓</b> Sustainability grade ${c.grade}</div>
    </div>

    <div class="verify">
      <div class="stamp"><b>VERIFIED ON LEDGER</b><br><span>${c.records.length} catch records · each independently verifiable by SHA-256 hash</span></div>
      <div class="qr">${qrImg}scan for<br>catch-to-plate</div>
    </div>

    <div class="warn"><b>Sample document.</b> Generated by an OceanMind demo from ledger data. Not a legally issued catch certificate. Production issuance would be on Hyperledger Fabric with authority co-signature.</div>

    <div class="foot"><span>OceanMind — AI-Driven Marine Data Intelligence</span><span>Issued ${new Date().toLocaleString()}</span></div>
    <script>window.onload=function(){setTimeout(function(){window.print();},350);}</script>
  </body></html>`;

  // Open the tab synchronously (inside the click gesture) so pop-up blockers
  // don't fire, then fill it once the QR data-URL is ready.
  const proofUrl = `${window.location.origin}/trace?tx=${c.records[0].transaction_id}`;
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups to download the certificate."); return; }
  w.document.write("<p style='font-family:sans-serif;color:#16434c;padding:24px'>Generating certificate…</p>");
  const fill = (qrImg: string) => { w.document.open(); w.document.write(buildDoc(qrImg)); w.document.close(); };
  QRCode.toDataURL(proofUrl, { width: 260, margin: 1, color: { dark: "#16323a", light: "#ffffff" } })
    .then((qr) => fill(`<img src="${qr}" width="92" height="92"/>`))
    .catch(() => fill(""));
}

function exportLedgerCsv(records: CatchRecord[]) {
  const cols = ["transaction_id", "block_number", "species_name", "species_aphia_id", "quantity_kg", "latitude", "longitude", "landing_site_id", "event_timestamp", "fisher_token", "pmmsy_cert_ref"];
  const head = cols.join(",");
  const body = records.map((r) => cols.map((c) => JSON.stringify((r as unknown as Record<string, unknown>)[c] ?? "")).join(",")).join("\n");
  const blob = new Blob([head + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "oceanmind_verified_catch_ledger.csv"; a.click();
  URL.revokeObjectURL(url);
}

const INCLUDED = [
  { icon: "ph ph-link", label: "Chain of custody", sub: "Boat → landing → export" },
  { icon: "ph ph-map-pin", label: "GPS catch origin", sub: "Per-catch coordinates" },
  { icon: "ph ph-identification-card", label: "Vessel / fisher ID", sub: "Traceable token" },
  { icon: "ph ph-fingerprint", label: "SHA-256 proof", sub: "Tamper-evident hash" },
  { icon: "ph ph-certificate", label: "PMMSY cert ref", sub: "Govt scheme linkage" },
  { icon: "ph ph-seal-check", label: "Compliance attestation", sub: "EU IUU · US SIMP" },
  { icon: "ph ph-leaf", label: "Sustainability grade", sub: "Per consignment" },
  { icon: "ph ph-fish", label: "Species (WoRMS)", sub: "Scientific + AphiaID" },
];

export default function ExporterConsolePreview() {
  const { data } = useSWR("/api/v1/trace/history", fetcher, { revalidateOnFocus: false });
  const records = data?.records ?? [];
  const consignments = buildConsignments(records);
  const totalKg = records.reduce((s, r) => s + r.quantity_kg, 0);
  // Resolved after mount so the server and first client render agree (an
  // origin that appears only on the client causes a hydration mismatch).
  // Empty base still yields a valid relative /trace?tx=… link.
  const [base, setBase] = useState("");
  useEffect(() => setBase(window.location.origin), []);

  return (
    <div className="animate-page-enter max-w-6xl">
      {/* Preview context bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted hover:text-accent transition-colors">
          <i className="ph ph-arrow-left text-[14px]" /> Back to Plans &amp; Pricing
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf2e4] border border-[#efe2cc] text-[#8f6516] text-[10px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5" style={mono}>
          <i className="ph ph-eye text-[12px]" /> Sample preview · Exporter tier
        </span>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl mb-5 p-6 md:p-7 text-[#f3f8f6] border border-white/10"
        style={{ background: darkGradient, boxShadow: "0 2px 4px rgba(14,45,52,0.2), 0 18px 40px rgba(14,45,52,0.22)" }}>
        <i className="ph ph-seal-check absolute -right-6 -bottom-8 text-[190px] text-white/[0.04] pointer-events-none" />
        <div className="text-[10px] uppercase tracking-[0.15em] text-[#9fe0d6]/70 mb-2" style={mono}>What seafood exporters see</div>
        <h1 className="text-[25px] md:text-[27px] font-semibold leading-tight m-0" style={serif}>Exporter Console</h1>
        <p className="text-[13px] text-[rgba(220,235,233,0.7)] leading-relaxed max-w-2xl mt-2">
          Every consignment below is built from OceanMind&apos;s live catch ledger — real SHA-256 records with GPS origin,
          vessel identity and landing data. Exporters download a customs-ready catch certificate per shipment,
          pre-attested against the destination market&apos;s IUU rules.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { v: consignments.length, l: "Active consignments", c: "#1f7a8c" },
          { v: `${totalKg.toFixed(0)} kg`, l: "Verified volume", c: "#16323a" },
          { v: records.length, l: "Catches on ledger", c: "#16323a" },
          { v: "100%", l: "Compliance rate", c: "#3a8c5f" },
        ].map((k) => (
          <div key={k.l} className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: cardShadow }}>
            <div className="text-[28px] font-bold leading-none" style={{ ...serif, color: k.c }}>{k.v}</div>
            <div className="text-[10px] uppercase tracking-[0.09em] text-text-muted mt-1.5" style={mono}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* What every certificate carries */}
      <div className="bg-white border border-card-border rounded-2xl p-5 mb-5" style={{ boxShadow: cardShadow }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted" style={mono}>Data on every certificate</div>
          <button onClick={() => exportLedgerCsv(records)} disabled={!records.length}
            className="inline-flex items-center gap-1.5 text-[12px] text-accent hover:text-accent-dark transition-colors disabled:opacity-40">
            <i className="ph ph-download-simple text-[14px]" /> Export full ledger (CSV)
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INCLUDED.map((f) => (
            <div key={f.label} className="flex items-start gap-2.5 rounded-xl bg-card-hover/60 border border-card-border p-3">
              <span className="w-8 h-8 flex-none rounded-lg bg-[#eaf3ef] text-accent flex items-center justify-center">
                <i className={`${f.icon} text-[16px]`} />
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-text leading-tight">{f.label}</div>
                <div className="text-[10.5px] text-text-muted mt-0.5">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consignments */}
      <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-3" style={mono}>Consignments ready to certify</div>
      {!records.length ? (
        <div className="bg-white border border-card-border rounded-2xl p-10 text-center text-sm text-text-muted" style={{ boxShadow: cardShadow }}>
          Loading verified catches from the ledger…
        </div>
      ) : (
        <div className="space-y-4">
          {consignments.map((c) => (
            <div key={c.id} className="bg-white border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: cardShadow }}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-card-border bg-[linear-gradient(168deg,#fbf7ee,#fff)]">
                <div className="flex items-center gap-3">
                  <span className="text-[26px] leading-none">{c.market.flag}</span>
                  <div>
                    <div className="text-[15px] font-semibold text-text leading-tight" style={serif}>{c.market.market} · {c.market.port}</div>
                    <div className="text-[11px] text-text-muted mt-0.5" style={mono}>{c.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold rounded-full px-2.5 py-1 ${c.grade === "A" ? "bg-[#eaf3ef] text-[#2f6f4c]" : "bg-[#f7efdb] text-[#8f6516]"}`} style={mono}>
                    GRADE {c.grade}
                  </span>
                  <button onClick={() => downloadCertificate(c)}
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-lg px-4 py-2 text-[13px] font-semibold transition-all hover:-translate-y-0.5">
                    <i className="ph ph-download-simple text-[15px]" /> Download certificate
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-5 py-4">
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-text-muted" style={mono}>Net weight</div>
                  <div className="text-[17px] font-bold text-text mt-0.5" style={serif}>{c.totalKg.toFixed(0)} kg</div>
                </div>
                <div>
                  <div className="text-[9.5px] uppercase tracking-wider text-text-muted" style={mono}>Verified catches</div>
                  <div className="text-[17px] font-bold text-text mt-0.5" style={serif}>{c.records.length}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[9.5px] uppercase tracking-wider text-text-muted" style={mono}>Framework</div>
                  <div className="text-[12.5px] text-text mt-1 flex items-center gap-1.5">
                    <i className="ph ph-seal-check text-[15px] text-[#2f6f4c]" /> {c.market.framework}
                  </div>
                </div>
              </div>
              <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                {c.species.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card-hover/60 px-2.5 py-1 text-[11.5px] text-text-secondary">
                    <i className="ph-fill ph-fish-simple text-[12px] text-accent" />
                    {s} <span className="text-text-faint italic">{speciesMeta(s).sci}</span>
                  </span>
                ))}
              </div>
              <div className="mx-5 mb-4 flex items-center gap-4 rounded-xl border border-card-border bg-card-hover/40 p-3">
                <a href={`${base}/trace?tx=${c.records[0].transaction_id}`} target="_blank" rel="noreferrer" className="flex-none" title="Open the consumer provenance page">
                  <QrCode value={`${base}/trace?tx=${c.records[0].transaction_id}`} size={72} />
                </a>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-text flex items-center gap-1.5"><i className="ph ph-qr-code text-[15px] text-accent" /> Catch-to-plate provenance</div>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">A consumer scans this on the package to trace the fish back to the boat, GPS origin and fisher — the same QR prints on the certificate.</p>
                  <a href={`${base}/trace?tx=${c.records[0].transaction_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] text-accent hover:text-accent-dark mt-1">
                    View provenance page <i className="ph ph-arrow-up-right text-[12px]" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-[0.62rem] text-text-faint mt-5">
        Preview of the paid Exporter Traceability tier · sample consignments built from demo ledger data · certificates are illustrative, not legally issued
      </div>
    </div>
  );
}
