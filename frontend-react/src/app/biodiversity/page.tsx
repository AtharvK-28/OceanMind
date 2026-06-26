"use client";
import { useState } from "react";
import useSWR from "swr";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetcher, apiPost } from "@/lib/api";
import HeroBanner from "@/components/ui/HeroBanner";
import MetricCard from "@/components/ui/MetricCard";
import TabGroup from "@/components/ui/TabGroup";
import DataTable from "@/components/ui/DataTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { CVAnalyzeResponse, EDNAAnalyzeResponse, SpeciesReferenceResponse } from "@/types/api";

const PIE_COLORS = [
  "#1f7a8c", "#3a8c5f", "#d49a2e", "#c25a44", "#ab47bc", "#26a69a", "#ec407a", "#8d6e63",
  "#7e57c2", "#2a6f7c", "#6d8c3e", "#d4a520", "#ff7043", "#6d7e80", "#5c6bc0", "#3a8c5f",
  "#b8a44e", "#1f7a8c", "#8a9698",
];

export default function BiodiversityPage() {
  const [tab, setTab] = useState("cv");

  // CV state
  const [cvForm, setCvForm] = useState({ site_lat: 8.5, site_lon: 76.9, site_name: "" });
  const [cvImage, setCvImage] = useState<string | null>(null);
  const [cvPreview, setCvPreview] = useState<string | null>(null);
  const [cvResult, setCvResult] = useState<CVAnalyzeResponse | null>(null);
  const [cvLoading, setCvLoading] = useState(false);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setCvImage(b64);
    };
    reader.readAsDataURL(file);
  }

  // eDNA state
  const [ednaForm, setEdnaForm] = useState({ sample_id: "OcM-eDNA-001", sample_lat: 12, sample_lon: 74, depth_m: 5 });
  const [ednaResult, setEdnaResult] = useState<EDNAAnalyzeResponse | null>(null);
  const [ednaLoading, setEdnaLoading] = useState(false);

  // Reference
  const { data: refData } = useSWR<SpeciesReferenceResponse>("/api/v1/cv/species-reference", fetcher);

  async function runCV(e: React.FormEvent) {
    e.preventDefault(); setCvLoading(true);
    try {
      const payload = { ...cvForm, image_base64: cvImage || undefined };
      setCvResult(await apiPost<CVAnalyzeResponse>("/api/v1/cv/analyze", payload));
    } finally { setCvLoading(false); }
  }

  async function runEdna(e: React.FormEvent) {
    e.preventDefault(); setEdnaLoading(true);
    try { setEdnaResult(await apiPost<EDNAAnalyzeResponse>("/api/v1/edna/analyze", ednaForm)); }
    finally { setEdnaLoading(false); }
  }

  const cvBarData = cvResult ? Object.entries(cvResult.species_summary).map(([name, count]) => ({ name: name.split(" ")[0], count })).sort((a, b) => b.count - a.count) : [];
  const ednaPieData = ednaResult ? ednaResult.taxa.slice(0, 8).map((t) => ({ name: t.species_scientific.split(" ")[0], value: t.read_count })) : [];

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Biodiversity & Computer Vision"
        description="<b>Phase B:</b> YOLOv8 landing-site fish detection + ResNet50 species classifier (13 Indian species). eDNA metabarcoding (1D CNN + BLAST+). WoRMS AphiaID entity resolution."
      />

      <TabGroup tabs={[
        { id: "cv", label: "CV Fish Analysis" },
        { id: "edna", label: "eDNA Analysis" },
        { id: "ref", label: "Species Reference" },
      ]} activeTab={tab} onChange={setTab} />

      {tab === "cv" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <form onSubmit={runCV} className="space-y-4">
            {/* Image upload — primary input */}
            <div className="border-2 border-dashed border-[#d8cfbc] rounded-xl p-6 text-center
                            hover:border-accent/40 transition-colors relative">
              {cvPreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cvPreview} alt="Catch photo" className="max-h-48 rounded-lg mx-auto" />
                  <button type="button" onClick={() => { setCvImage(null); setCvPreview(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    &times;
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2"><i className="ph ph-camera text-text-muted" /></div>
                  <p className="text-sm text-text-muted mb-1">Drop a catch photo or tap to take one</p>
                  <p className="text-xs text-text-faint">JPG, PNG — the model will detect fish species</p>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs text-text-muted">Latitude</span>
                <input type="number" step="0.1" value={cvForm.site_lat} onChange={(e) => setCvForm({ ...cvForm, site_lat: +e.target.value })}
                  className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
              </label>
              <label className="block">
                <span className="text-xs text-text-muted">Longitude</span>
                <input type="number" step="0.1" value={cvForm.site_lon} onChange={(e) => setCvForm({ ...cvForm, site_lon: +e.target.value })}
                  className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" />
              </label>
              <label className="block">
                <span className="text-xs text-text-muted">Site Name</span>
                <input type="text" value={cvForm.site_name} onChange={(e) => setCvForm({ ...cvForm, site_name: e.target.value })}
                  placeholder="e.g. Vizhinjam"
                  className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint" />
              </label>
            </div>

            <button type="submit" disabled={cvLoading}
              className="w-full bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
              {cvLoading ? "Running detection..." : cvImage ? "Detect fish species" : "Run with synthetic data"}
            </button>
            {cvImage && <p className="text-xs text-[#3a8c5f]/70 text-center">YOLOv8 detection + ResNet50 species classifier will run on your photo</p>}
          </form>

          {/* Model info sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>CV Pipeline</h3>
              {[
                { icon: "ph ph-bounding-box", label: "Detection", value: "YOLOv8" },
                { icon: "ph ph-brain", label: "Classifier", value: "ResNet50" },
                { icon: "ph ph-fish", label: "Species", value: "13 trained" },
                { icon: "ph ph-database", label: "Taxonomy", value: "WoRMS AphiaID" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-2 border-t border-[#f0ebdf] first:border-0">
                  <i className={`${item.icon} text-[15px] text-accent`} />
                  <div className="flex-1">
                    <div className="text-[11px] text-text-muted">{item.label}</div>
                    <div className="text-[13px] font-semibold text-text">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Trained species</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Indian Mackerel", "Oil Sardine", "Hilsa", "Pomfret", "Rohu", "Catla", "Bombay Duck", "Sea Bass", "Seer Fish", "Mrigal", "Ribbonfish", "Indian Salmon", "Basa"].map((sp) => (
                  <span key={sp} className="text-[10px] px-2 py-1 rounded-md bg-card-hover border border-card-border text-text-secondary" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{sp}</span>
                ))}
              </div>
            </div>
          </div>
          </div>
          {cvLoading && <LoadingSpinner text="Running CV pipeline..." />}
          {cvResult && !cvLoading && (
            <>
              <p className="text-[#3a8c5f] font-medium">Detected <b>{cvResult.total_fish_detected}</b> fish across <b>{Object.keys(cvResult.species_summary).length}</b> species
                <span className="text-text-faint text-xs ml-2">({cvResult.model})</span>
              </p>
              {cvBarData.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cvBarData}><XAxis dataKey="name" tick={{ fill: "#6d7e80", fontSize: 11 }} /><YAxis tick={{ fill: "#8a9698", fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#1f7a8c" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              )}
              <DataTable columns={[
                { key: "species_scientific", label: "Species" }, { key: "species_common", label: "Common Name" },
                { key: "aphia_id", label: "AphiaID" }, { key: "confidence", label: "Confidence" },
                { key: "fork_length_mm", label: "Fork Length (mm)" }, { key: "estimated_weight_g", label: "Weight (g)" },
                { key: "source", label: "Source" },
              ]} data={cvResult.detections.map((d) => ({ ...d, confidence: (d.confidence * 100).toFixed(1) + "%", source: d.source ?? "synthetic" }))} exportFilename="oceanmind_cv_detections" />
            </>
          )}
        </div>
      )}

      {tab === "edna" && (
        <div className="space-y-6">
          <form onSubmit={runEdna} className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
            <label className="block"><span className="text-xs text-text-muted">Sample ID</span>
              <input type="text" value={ednaForm.sample_id} onChange={(e) => setEdnaForm({ ...ednaForm, sample_id: e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" /></label>
            <label className="block"><span className="text-xs text-text-muted">Latitude</span>
              <input type="number" step="0.5" value={ednaForm.sample_lat} onChange={(e) => setEdnaForm({ ...ednaForm, sample_lat: +e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" /></label>
            <label className="block"><span className="text-xs text-text-muted">Longitude</span>
              <input type="number" step="0.5" value={ednaForm.sample_lon} onChange={(e) => setEdnaForm({ ...ednaForm, sample_lon: +e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" /></label>
            <label className="block"><span className="text-xs text-text-muted">Depth (m)</span>
              <input type="number" value={ednaForm.depth_m} onChange={(e) => setEdnaForm({ ...ednaForm, depth_m: +e.target.value })}
                className="w-full mt-1 bg-card-hover border border-card-border rounded-lg px-3 py-2 text-sm text-text" /></label>
            <button type="submit" disabled={ednaLoading}
              className="col-span-2 md:col-span-4 bg-accent hover:bg-accent-dark text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
              {ednaLoading ? "Running..." : "Run eDNA Analysis"}
            </button>
          </form>
          {ednaLoading && <LoadingSpinner text="Running eDNA pipeline..." />}
          {ednaResult && !ednaLoading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Species Detected" value={ednaResult.species_detected} />
                <MetricCard label="Total Reads" value={ednaResult.total_reads.toLocaleString()} />
                <MetricCard label="Shannon H'" value={ednaResult.diversity_indices.shannon_h.toFixed(4)} />
                <MetricCard label="Simpson D'" value={ednaResult.diversity_indices.simpson_d.toFixed(4)} />
              </div>
              <DataTable columns={[
                { key: "species_scientific", label: "Species" }, { key: "species_common", label: "Common" },
                { key: "aphia_id", label: "AphiaID" }, { key: "read_count", label: "Reads" },
                { key: "confidence", label: "Confidence" }, { key: "detection_method", label: "Method" },
              ]} data={ednaResult.taxa.map((t) => ({ ...t, confidence: (t.confidence * 100).toFixed(1) + "%" }))} exportFilename="oceanmind_edna_taxa" />
              {ednaPieData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart><Pie data={ednaPieData} dataKey="value" nameKey="name" outerRadius={100} strokeWidth={0}>
                    {ednaPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      )}

      {tab === "ref" && (
        <div>
          {refData && <p className="text-sm text-text-muted mb-4"><b>{refData.species_count}</b> species in reference database. Milestone AphiaIDs: {refData.milestone_species.join(", ")}</p>}
          <DataTable columns={[
            { key: "species", label: "Species" }, { key: "common", label: "Common Name" },
            { key: "aphia_id", label: "AphiaID" }, { key: "status", label: "WoRMS Status" },
          ]} data={(refData?.species ?? []).map((s) => ({ ...s, status: s.worms.status }))} />
        </div>
      )}
    </div>
  );
}
