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
  const expertItems = NAV_ITEMS.filter((i) => i.section === "expert");

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3
                      bg-[#06101f]/95 backdrop-blur-md border-b border-white/5">
        <button onClick={() => setOpen(!open)} className="text-white/80 hover:text-white p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <path d="M6 6l12 12M6 18L18 6" />
              : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
          </svg>
        </button>
        <span className="text-lg">🌊</span>
        <span className="text-sm font-semibold text-[#e0f7fa]">{currentPage?.label ?? "OceanMind"}</span>
      </div>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col
        bg-gradient-to-b from-[#06101f] via-[#0b1a2e] to-[#0e223d] border-r border-white/5
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="text-center py-6 px-4">
          <div className="text-4xl leading-none">🌊</div>
          <div className="text-xl font-bold mt-1.5 text-[#e0f7fa] tracking-tight">OceanMind</div>
          <div className="text-[0.72rem] text-white/45 mt-0.5">AI Marine Intelligence &middot; Biothon 2026</div>
        </div>

        <div className="border-t border-white/6 mx-4" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto" onClick={() => setOpen(false)}>
          {/* Fisher section */}
          <div className="space-y-0.5 mb-3">
            {fisherItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          <div className="px-3 py-2">
            <div className="text-[0.6rem] uppercase tracking-widest text-white/25 font-semibold">Expert Dashboard</div>
          </div>

          <div className="space-y-0.5">
            {expertItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </nav>

        <div className="border-t border-white/6 mx-4" />

        {/* System status */}
        <div className="py-3">
          <SystemStatus />
        </div>
      </aside>
    </>
  );
}
