"use client";
import { useRef, useEffect, useState } from "react";

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function TabGroup({ tabs, activeTab, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (activeEl) {
      setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    }
  }, [activeTab]);

  return (
    <div className="relative mb-6">
      <div ref={containerRef} className="flex gap-1 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors duration-200 relative z-10
              ${activeTab === tab.id
                ? "text-white"
                : "text-white/50 hover:text-white/80"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Sliding indicator */}
      <div
        className="absolute bottom-0 h-0.5 bg-[#4fc3f7] rounded-full transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
}

export function TabContent({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`transition-all duration-300 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none absolute"}`}>
      {active && children}
    </div>
  );
}
