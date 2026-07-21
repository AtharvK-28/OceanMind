"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { HealthResponse } from "@/types/api";

export default function SystemStatus() {
  const { data } = useSWR<HealthResponse>("/health", fetcher, { refreshInterval: 30000 });

  if (!data) return <div className="text-[10px] text-[rgba(220,235,233,0.4)] px-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Connecting...</div>;

  const dbOk = data.db === "ok";
  const mhiOk = data.mhi_model === "loaded";
  const sfzOk = data.sfz_model === "loaded";

  return (
    <div className="mx-4 p-[13px] rounded-[13px] bg-white/[0.06] border border-white/[0.08]">
      <div className="flex items-center gap-2 mb-[9px]">
        <span className="w-[7px] h-[7px] rounded-full bg-[#6fd29a]" style={{ animation: "pulse 2.4s infinite" }} />
        <span className="text-[10px] tracking-[0.08em] text-[rgba(220,235,233,0.75)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>SYSTEMS ONLINE</span>
      </div>
      <div className="flex gap-[6px]">
        <span className="flex-1 text-center text-[9px] py-1 rounded-md bg-[rgba(143,211,200,0.12)] text-accent-light" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>API</span>
        <span title={dbOk ? "PostGIS connected" : "PostGIS offline — synthetic fallback active"}
          className={`flex-1 text-center text-[9px] py-1 rounded-md ${dbOk ? "bg-[rgba(143,211,200,0.12)] text-accent-light" : "bg-[rgba(212,154,46,0.15)] text-[#d4a43a]"}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{dbOk ? "PostGIS" : "Fallback"}</span>
        <span className={`flex-1 text-center text-[9px] py-1 rounded-md ${mhiOk && sfzOk ? "bg-[rgba(143,211,200,0.12)] text-accent-light" : "bg-[rgba(212,154,46,0.15)] text-[#d4a43a]"}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Models</span>
      </div>
    </div>
  );
}
