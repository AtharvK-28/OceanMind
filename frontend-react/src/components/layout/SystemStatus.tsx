"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { HealthResponse } from "@/types/api";

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${ok ? "bg-green-500" : "bg-amber-500"}`} />;
}

export default function SystemStatus() {
  const { data } = useSWR<HealthResponse>("/health", fetcher, { refreshInterval: 30000 });

  if (!data) return <div className="text-xs text-white/30 px-4">Connecting...</div>;

  const dbOk = data.db === "ok";
  const mhiOk = data.mhi_model === "loaded";
  const sfzOk = data.sfz_model === "loaded";
  const ragOk = data.rag === "ready";

  return (
    <div className="px-4 py-2">
      <div className="text-[0.62rem] uppercase tracking-wider text-white/35 font-semibold mb-1.5">System</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-white/65">
        <span><Dot ok={dbOk} />PostGIS</span>
        <span><Dot ok={mhiOk} />MHI</span>
        <span><Dot ok={sfzOk} />SFZ</span>
        <span><Dot ok={ragOk} />RAG</span>
      </div>
      <div className="text-[0.65rem] text-white/30 mt-2">
        ⛓️ {data.blockchain}
      </div>
    </div>
  );
}
