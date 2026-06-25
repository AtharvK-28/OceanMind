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
  "#4fc3f7", "#66bb6a", "#ffa726", "#ef5350", "#ab47bc", "#26c6da", "#ec407a", "#8d6e63",
  "#7e57c2", "#29b6f6", "#9ccc65", "#ffca28", "#ff7043", "#78909c", "#5c6bc0", "#26a69a",
  "#d4e157", "#42a5f5", "#bdbdbd",
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
        title="🔬 Biodiversity & Computer Vision"
        description="<b>Phase B:</b> YOLOv8 landing-site fish detection + ResNet50 species classifier (13 Indian species). eDNA metabarcoding (1D CNN + BLAST+). WoRMS AphiaID entity resolution."
        gradient="from-[#bf360c] via-[#d84315] to-[#e64a19]"
      />

      <TabGroup tabs={[
        { id: "cv", label: "📸 CV Fish Analysis" },
        { id: "edna", label: "🧬 eDNA Analysis" },
        { id: "ref", label: "📋 Species Reference" },
      ]} activeTab={tab} onChange={setTab} />

      {tab === "cv" && (
        <div className="space-y-6">
          <form onSubmit={runCV} className="max-w-2xl space-y-4">
            {/* Image upload — primary input */}
            <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center
                            hover:border-[#e64a19]/40 transition-colors relative">
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
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-sm text-white/50 mb-1">Drop a catch photo or tap to take one</p>
                  <p className="text-xs text-white/30">JPG, PNG — the model will detect fish species</p>
                </div>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs text-white/50">Latitude</span>
                <input type="number" step="0.1" value={cvForm.site_lat} onChange={(e) => setCvForm({ ...cvForm, site_lat: +e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </label>
              <label className="block">
                <span className="text-xs text-white/50">Longitude</span>
                <input type="number" step="0.1" value={cvForm.site_lon} onChange={(e) => setCvForm({ ...cvForm, site_lon: +e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
              </label>
              <label className="block">
                <span className="text-xs text-white/50">Site Name</span>
                <input type="text" value={cvForm.site_name} onChange={(e) => setCvForm({ ...cvForm, site_name: e.target.value })}
                  placeholder="e.g. Vizhinjam"
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25" />
              </label>
            </div>

            <button type="submit" disabled={cvLoading}
              className="w-full bg-[#e64a19] hover:bg-[#d84315] text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
              {cvLoading ? "Running detection..." : cvImage ? "Detect fish species" : "Run with synthetic data"}
            </button>
            {cvImage && <p className="text-xs text-green-400/60 text-center">YOLOv8 detection + ResNet50 species classifier will run on your photo</p>}
          </form>
          {cvLoading && <LoadingSpinner text="Running CV pipeline..." />}
          {cvResult && !cvLoading && (
            <>
              <p className="text-green-400 font-medium">Detected <b>{cvResult.total_fish_detected}</b> fish across <b>{Object.keys(cvResult.species_summary).length}</b> species
                <span className="text-white/40 text-xs ml-2">({cvResult.model})</span>
              </p>
              {cvBarData.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cvBarData}><XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} /><YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#e64a19" radius={[6, 6, 0, 0]} /></BarChart>
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
            <label className="block"><span className="text-xs text-white/50">Sample ID</span>
              <input type="text" value={ednaForm.sample_id} onChange={(e) => setEdnaForm({ ...ednaForm, sample_id: e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" /></label>
            <label className="block"><span className="text-xs text-white/50">Latitude</span>
              <input type="number" step="0.5" value={ednaForm.sample_lat} onChange={(e) => setEdnaForm({ ...ednaForm, sample_lat: +e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" /></label>
            <label className="block"><span className="text-xs text-white/50">Longitude</span>
              <input type="number" step="0.5" value={ednaForm.sample_lon} onChange={(e) => setEdnaForm({ ...ednaForm, sample_lon: +e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" /></label>
            <label className="block"><span className="text-xs text-white/50">Depth (m)</span>
              <input type="number" value={ednaForm.depth_m} onChange={(e) => setEdnaForm({ ...ednaForm, depth_m: +e.target.value })}
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" /></label>
            <button type="submit" disabled={ednaLoading}
              className="col-span-2 md:col-span-4 bg-[#e64a19] hover:bg-[#d84315] text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
              {ednaLoading ? "Running..." : "🧬 Run eDNA Analysis"}
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
          {refData && <p className="text-sm text-white/60 mb-4"><b>{refData.species_count}</b> species in reference database. Milestone AphiaIDs: {refData.milestone_species.join(", ")}</p>}
          <DataTable columns={[
            { key: "species", label: "Species" }, { key: "common", label: "Common Name" },
            { key: "aphia_id", label: "AphiaID" }, { key: "status", label: "WoRMS Status" },
          ]} data={(refData?.species ?? []).map((s) => ({ ...s, status: s.worms.status }))} />
        </div>
      )}
    </div>
  );
}
