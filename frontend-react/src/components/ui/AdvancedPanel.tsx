"use client";
import { useState } from "react";

export default function AdvancedPanel({ title, defaultOpen = false, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-[#ece5d6] rounded-2xl overflow-hidden"
         style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] font-semibold text-text-muted"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <i className="ph ph-sliders-horizontal text-accent" />{title}
        </span>
        <i className={`ph ph-caret-${open ? "up" : "down"} text-text-muted`} />
      </button>
      {open && <div className="px-5 pb-5 animate-data-enter">{children}</div>}
    </div>
  );
}
