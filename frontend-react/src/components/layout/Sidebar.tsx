"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import NavLink from "./NavLink";
import SystemStatus from "./SystemStatus";
import { NAV_ITEMS } from "@/lib/constants";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentPage = NAV_ITEMS.find(
    (i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href))
  );

  const fisherItems = NAV_ITEMS.filter((i) => i.section === "fisher");
  const policyItems = NAV_ITEMS.filter((i) => i.section === "policy");
  const expertItems = NAV_ITEMS.filter((i) => i.section === "expert");

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3
                      bg-[#16434c]/95 backdrop-blur-md border-b border-white/5">
        <button onClick={() => setOpen(!open)} className="text-[#cfe6e2] hover:text-white p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <path d="M6 6l12 12M6 18L18 6" />
              : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
          </svg>
        </button>
        <i className="ph ph-wave-sine text-xl text-[#9fe0d6]" />
        <span className="text-sm font-semibold text-[#f3f8f6]">{currentPage?.label ?? "OceanMind"}</span>
      </div>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-[250px] flex flex-col
        border-r border-white/5
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `} style={{ background: "linear-gradient(177deg, #16434c 0%, #10333b 60%, #0e2d34 100%)" }}>
        {/* Brand */}
        <div className="px-[22px] pt-6 pb-[18px]">
          <div className="flex items-center gap-[11px]">
            <div className="w-[38px] h-[38px] rounded-[11px] bg-white/10 border border-white/[0.14] flex items-center justify-center text-[#9fe0d6]">
              <i className="ph ph-wave-sine text-[21px]" />
            </div>
            <div>
              <div className="text-[21px] font-semibold leading-none text-[#f3f8f6] tracking-tight" style={{ fontFamily: "'Newsreader', serif" }}>OceanMind</div>
              <div className="text-[9.5px] tracking-[0.13em] uppercase text-[rgba(220,235,233,0.45)] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Marine Intelligence</div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.08] mx-[18px] mb-[14px]" />

        {/* Navigation */}
        <nav className="flex-1 px-[14px] py-0 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="text-[9.5px] tracking-[0.15em] uppercase text-[rgba(220,235,233,0.4)] px-[10px] py-1 pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>On the water</div>
          <div className="space-y-[3px] mb-3">
            {fisherItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          <div className="text-[9.5px] tracking-[0.15em] uppercase text-[rgba(220,235,233,0.4)] px-[10px] pt-4 pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Policy & conservation</div>
          <div className="space-y-[2px] mb-3">
            {policyItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          <div className="text-[9.5px] tracking-[0.15em] uppercase text-[rgba(220,235,233,0.4)] px-[10px] pt-4 pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Research console</div>
          <div className="space-y-[2px]">
            {expertItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </nav>

        <div className="border-t border-white/[0.06] mx-4" />
        <div className="py-3">
          <SystemStatus />
        </div>
      </aside>
    </>
  );
}
