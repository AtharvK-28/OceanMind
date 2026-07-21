"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import NavLink from "./NavLink";
import SystemStatus from "./SystemStatus";
import LanguageToggle from "@/components/ui/LanguageToggle";
import InstallButton from "@/components/pwa/InstallButton";
import { usePersona } from "@/lib/persona";
import { DEMO_ALERTS_KEY } from "@/components/ui/DemoAlerts";
import { NAV_ITEMS } from "@/lib/constants";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  // Read after mount so server and client first render agree.
  const [alertsOn, setAlertsOn] = useState(true);
  useEffect(() => { setAlertsOn(localStorage.getItem(DEMO_ALERTS_KEY) !== "off"); }, []);
  function toggleAlerts() {
    setAlertsOn((on) => {
      const next = !on;
      localStorage.setItem(DEMO_ALERTS_KEY, next ? "on" : "off");
      return next;
    });
  }
  const { persona, setPersona } = usePersona();
  const fisherMode = persona === "fisher";
  const [showResearch, setShowResearch] = useState(false);
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
                      bg-[#16434c]/95 backdrop-blur-md border-b border-white/5">
        <button onClick={() => setOpen(!open)} className="text-[#cfe6e2] hover:text-white p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <path d="M6 6l12 12M6 18L18 6" />
              : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
          </svg>
        </button>
        <i className="ph ph-wave-sine text-xl text-[#9fe0d6]" />
        <span className="text-sm font-semibold text-[#f3f8f6] min-w-0 truncate">{currentPage?.label ?? "OceanMind"}</span>
        <div className="ml-auto flex-none flex items-center gap-2">
          <InstallButton />
          <LanguageToggle variant="dark" />
        </div>
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
        <div className="px-[22px] pt-4 pb-3">
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

        <div className="h-px bg-white/[0.08] mx-[18px] mb-2" />

        {/* Navigation — bottom fade hints at overflow on short screens */}
        <nav className="flex-1 px-[14px] py-0 overflow-y-auto" onClick={() => setOpen(false)}
          style={{ maskImage: "linear-gradient(to bottom, black calc(100% - 18px), transparent)", WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 18px), transparent)" }}>
          <div className="text-[9.5px] tracking-[0.15em] uppercase text-[rgba(220,235,233,0.4)] px-[10px] py-1 pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>On the water</div>
          <div className="space-y-[3px] mb-3">
            {fisherItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          {fisherMode ? (
            // Fishers get the research tools collapsed by default — reachable,
            // but out of the way of the on-the-water essentials.
            <button
              onClick={(e) => { e.stopPropagation(); setShowResearch((v) => !v); }}
              className="w-full flex items-center justify-between px-[10px] pt-3 pb-1.5 text-[9.5px] tracking-[0.15em] uppercase text-[rgba(220,235,233,0.4)] hover:text-[rgba(220,235,233,0.7)] transition-colors"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <span>Research console</span>
              <i className={`ph ${showResearch ? "ph-caret-up" : "ph-caret-down"} text-[11px]`} />
            </button>
          ) : (
            <div className="text-[9.5px] tracking-[0.15em] uppercase text-[rgba(220,235,233,0.4)] px-[10px] pt-3 pb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Research console</div>
          )}
          {(!fisherMode || showResearch) && (
            <div className="space-y-[2px]">
              {expertItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          )}
        </nav>

        <div className="border-t border-white/[0.06] mx-4" />
        {persona && (
          <button
            onClick={() => { setPersona(null); setOpen(false); }}
            className="mx-4 mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-[rgba(220,235,233,0.55)] hover:text-[#9fe0d6] transition-colors"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            <i className="ph ph-user-switch text-[13px]" />
            Viewing as {persona === "fisher" ? "Fisher" : "Researcher"} · Switch
          </button>
        )}
        <InstallButton variant="sidebar" />
        <button
          onClick={toggleAlerts}
          title={alertsOn ? "Turn off the scripted demo notifications" : "Turn the demo notifications back on"}
          className="mx-4 mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-[rgba(220,235,233,0.55)] hover:text-[#9fe0d6] transition-colors"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          <i className={`ph ${alertsOn ? "ph-bell" : "ph-bell-slash"} text-[13px]`} />
          Demo alerts {alertsOn ? "on" : "off"}
        </button>
        <div className="px-4 pt-2 flex justify-center">
          <LanguageToggle variant="dark" />
        </div>
        <div className="py-3">
          <SystemStatus />
        </div>
      </aside>
    </>
  );
}
