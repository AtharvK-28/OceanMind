"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import HeroBanner from "@/components/ui/HeroBanner";
import type { SpeciesReferenceResponse } from "@/types/api";

interface SpeciesInfo {
  key: string;
  common: string;
  scientific: string;
  image: string;
  habitat: string;
  iucn: string;
  iucnColor: string;
  depth: string;
  diet: string;
  maxLength: string;
  importance: string;
  worms: number;
  tags: string[];
}

const SPECIES_DATA: SpeciesInfo[] = [
  {
    key: "IndianMackerel", common: "Indian Mackerel", scientific: "Rastrelliger kanagurta",
    image: "/species/IndianMackerel1.jpg",
    habitat: "Coastal pelagic, continental shelf (20–90 m). Indo-West Pacific.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "20–90 m", diet: "Zooplankton, phytoplankton, small crustaceans",
    maxLength: "35 cm", importance: "Top-5 Indian marine catch. 2.13M tonnes (2020 CMFRI).",
    worms: 217044, tags: ["Pelagic", "Migratory", "Commercial"],
  },
  {
    key: "IndianOilSardine", common: "Oil Sardine", scientific: "Sardinella longiceps",
    image: "/species/IndianOilSardine1.jpg",
    habitat: "Coastal pelagic, neritic zone (0–200 m). Arabian Sea, Bay of Bengal.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "0–200 m", diet: "Diatoms (Fragilaria oceanica), phytoplankton",
    maxLength: "23 cm", importance: "Largest single-species fishery in India. Kerala dominates catch.",
    worms: 217033, tags: ["Pelagic", "Upwelling-dependent", "Commercial"],
  },
  {
    key: "Hilsa", common: "Hilsa Shad", scientific: "Tenualosa ilisha",
    image: "/species/Hilsa1.jpg",
    habitat: "Anadromous — marine to freshwater. Bay of Bengal, Ganges-Brahmaputra delta.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "0–50 m", diet: "Plankton, algae, crustaceans",
    maxLength: "60 cm", importance: "National fish of Bangladesh. Critical to Bengal & Odisha livelihoods.",
    worms: 277274, tags: ["Anadromous", "Migratory", "Cultural"],
  },
  {
    key: "Pomfret", common: "Silver Pomfret", scientific: "Pampus argenteus",
    image: "/species/Pomfret1.jpg",
    habitat: "Demersal, soft-bottom continental shelf. Arabian Sea, Persian Gulf.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "5–110 m", diet: "Jellyfish, ctenophores, small invertebrates",
    maxLength: "60 cm", importance: "Premium table fish. Highest per-kg value in Indian markets.",
    worms: 218485, tags: ["Demersal", "High-value", "Commercial"],
  },
  {
    key: "Rohu", common: "Rohu", scientific: "Labeo rohita",
    image: "/species/Rohu1.jpg",
    habitat: "Freshwater — rivers, lakes, reservoirs. Ganges basin, throughout South Asia.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "0–5 m (riverine)", diet: "Herbivorous — algae, plant material, zooplankton",
    maxLength: "100 cm", importance: "Most farmed freshwater fish in India. Aquaculture staple.",
    worms: 322877, tags: ["Freshwater", "Aquaculture", "IMC"],
  },
  {
    key: "Catla", common: "Catla", scientific: "Labeo catla",
    image: "/species/Catla1.jpg",
    habitat: "Freshwater — rivers, floodplains. Ganges-Brahmaputra system.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "0–5 m (surface feeder)", diet: "Zooplankton, phytoplankton (surface feeder)",
    maxLength: "120 cm", importance: "Indian Major Carp. Key species in polyculture systems.",
    worms: 322872, tags: ["Freshwater", "Aquaculture", "IMC"],
  },
  {
    key: "SeaBass", common: "Barramundi / Asian Sea Bass", scientific: "Lates calcarifer",
    image: "/species/SeaBass1.jpg",
    habitat: "Catadromous — estuaries, mangroves, coastal. Indo-West Pacific.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "0–40 m", diet: "Predatory — fish, crustaceans",
    maxLength: "180 cm", importance: "High-value aquaculture species. Growing cage culture in India.",
    worms: 278757, tags: ["Euryhaline", "Predator", "Aquaculture"],
  },
  {
    key: "SeerFish", common: "Indo-Pacific Seer Fish", scientific: "Scomberomorus guttatus",
    image: "/species/SeerFish1.jpg",
    habitat: "Coastal pelagic, near reefs. Arabian Sea, Bay of Bengal.",
    iucn: "Near Threatened", iucnColor: "#d49a2e",
    depth: "10–80 m", diet: "Small fish (anchovies, sardines), squid",
    maxLength: "76 cm", importance: "Premium fish in South India. Gillnet and hook-and-line fishery.",
    worms: 211834, tags: ["Pelagic", "Predator", "High-value"],
  },
  {
    key: "BombayDuck", common: "Bombay Duck", scientific: "Harpadon nehereus",
    image: "/species/BombayDuck1.jpg",
    habitat: "Demersal/pelagic, estuarine, muddy bottoms. NW Indian Ocean.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "20–90 m", diet: "Small fish, crustaceans, worms",
    maxLength: "40 cm", importance: "Iconic Mumbai/Gujarat dried fish. Major trawl bycatch.",
    worms: 217593, tags: ["Demersal", "Dried fish", "Commercial"],
  },
  {
    key: "IndiaBasa", common: "Yellowtail Catfish / Basa", scientific: "Pangasius pangasius",
    image: "/species/IndiaBasa1.jpg",
    habitat: "Freshwater — large rivers, estuaries. Ganges, Brahmaputra, Mahanadi.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "0–10 m (riverine)", diet: "Omnivorous — plant matter, crustaceans, small fish",
    maxLength: "150 cm", importance: "Rapidly growing aquaculture. Andhra Pradesh dominates farming.",
    worms: 307991, tags: ["Freshwater", "Aquaculture", "Catfish"],
  },
  {
    key: "Mrigal", common: "Mrigal Carp", scientific: "Cirrhinus cirrhosus",
    image: "/species/Mrigal1.jpg",
    habitat: "Freshwater — rivers, ponds. Ganges basin, peninsular rivers.",
    iucn: "Vulnerable", iucnColor: "#c25a44",
    depth: "0–5 m (bottom feeder)", diet: "Detritivore — decaying organic matter, algae",
    maxLength: "100 cm", importance: "Indian Major Carp. Third species in carp polyculture.",
    worms: 322874, tags: ["Freshwater", "Aquaculture", "IMC"],
  },
  {
    key: "IndianSalmon", common: "Indian Salmon / Threadfin", scientific: "Eleutheronema tetradactylum",
    image: "/species/IndianSalmon1.jpg",
    habitat: "Coastal, estuarine, sandy/muddy bottoms. Arabian Sea, Bay of Bengal.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "10–40 m", diet: "Small fish, prawns, crustaceans",
    maxLength: "180 cm", importance: "Premium table fish. Important in Maharashtra and Gujarat.",
    worms: 280720, tags: ["Coastal", "Predator", "High-value"],
  },
  {
    key: "Ribbonfishes", common: "Largehead Hairtail / Ribbonfish", scientific: "Trichiurus lepturus",
    image: "/species/Ribbonfishes1.jpg",
    habitat: "Benthopelagic, continental shelf. Worldwide tropical/temperate.",
    iucn: "Least Concern", iucnColor: "#3a8c5f",
    depth: "0–400 m", diet: "Small fish, squid, crustaceans",
    maxLength: "234 cm", importance: "Major trawl catch species. High export value (dried/frozen).",
    worms: 127188, tags: ["Benthopelagic", "Export", "Commercial"],
  },
];

const HABITAT_FILTERS = ["All", "Marine", "Freshwater", "Migratory"];

export default function SpeciesPage() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<SpeciesInfo | null>(null);
  const { data: refData } = useSWR<SpeciesReferenceResponse>("/api/v1/cv/species-reference", fetcher);

  const filtered = filter === "All" ? SPECIES_DATA
    : filter === "Marine" ? SPECIES_DATA.filter(s => !s.tags.includes("Freshwater") && !s.tags.includes("Anadromous"))
    : filter === "Freshwater" ? SPECIES_DATA.filter(s => s.tags.includes("Freshwater"))
    : SPECIES_DATA.filter(s => s.tags.includes("Migratory") || s.tags.includes("Anadromous"));

  return (
    <div className="animate-page-enter">
      <HeroBanner
        title="Species Encyclopedia"
        description={`<b>${SPECIES_DATA.length} species</b> in the OceanMind database. All taxonomy validated against <b>WoRMS</b> (World Register of Marine Species). Images from OceanMind training dataset.`}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {HABITAT_FILTERS.map(f => (
          <button key={f} onClick={() => { setFilter(f); setSelected(null); }}
            className="px-4 py-2 rounded-full text-[12.5px] font-semibold border transition-all"
            style={{
              background: filter === f ? "#1f7a8c" : "white",
              borderColor: filter === f ? "#1f7a8c" : "#ece5d6",
              color: filter === f ? "white" : "#6d7e80",
            }}>
            {f === "All" ? `All (${SPECIES_DATA.length})` : f}
          </button>
        ))}
        <div className="flex-1" />
        <div className="text-[10px] text-text-faint self-center" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {refData ? `${refData.species_count} species in API` : "Loading..."}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Species grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(sp => (
            <button key={sp.key} onClick={() => setSelected(sp)}
              className="text-left bg-white border rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
              style={{
                borderColor: selected?.key === sp.key ? "#1f7a8c" : "#ece5d6",
                boxShadow: selected?.key === sp.key
                  ? "0 4px 20px rgba(31,122,140,0.2)"
                  : "0 1px 2px rgba(23,48,57,0.04), 0 8px 20px rgba(23,48,57,0.03)",
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sp.image} alt={sp.common}
                className="w-full h-32 object-cover" style={{ background: "#eee7d8" }} />
              <div className="p-3.5">
                <div className="text-[14px] font-semibold text-text" style={{ fontFamily: "'Newsreader', serif" }}>{sp.common}</div>
                <div className="text-[10.5px] text-text-muted italic">{sp.scientific}</div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {sp.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] px-2 py-0.5 rounded-md bg-card-hover border border-card-border text-text-muted"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{t}</span>
                  ))}
                  <span className="text-[9px] px-2 py-0.5 rounded-md border" style={{
                    background: sp.iucnColor + "15", borderColor: sp.iucnColor + "30", color: sp.iucnColor,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>{sp.iucn}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-6 self-start">
          {selected ? (
            <div className="bg-white border border-card-border rounded-2xl overflow-hidden animate-data-enter"
                 style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 12px 30px rgba(23,48,57,0.05)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.image} alt={selected.common} className="w-full h-48 object-cover" style={{ background: "#eee7d8" }} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="text-[20px] font-semibold text-[#15323a]" style={{ fontFamily: "'Newsreader', serif" }}>{selected.common}</div>
                    <div className="text-[12px] text-text-muted italic">{selected.scientific}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{
                    background: selected.iucnColor + "15", color: selected.iucnColor,
                    border: `1px solid ${selected.iucnColor}30`, fontFamily: "'IBM Plex Mono', monospace",
                  }}>{selected.iucn}</span>
                </div>

                <p className="text-[12.5px] text-text-secondary leading-relaxed mt-3 mb-4">{selected.habitat}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { icon: "ph ph-ruler", label: "Max Length", value: selected.maxLength },
                    { icon: "ph ph-waves", label: "Depth", value: selected.depth },
                    { icon: "ph ph-bowl-food", label: "Diet", value: selected.diet.split(",")[0] },
                    { icon: "ph ph-database", label: "AphiaID", value: String(selected.worms) },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl bg-card-hover border border-card-border">
                      <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-1">
                        <i className={s.icon} style={{ fontSize: 12, color: "#1f7a8c" }} />
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</span>
                      </div>
                      <div className="text-[12.5px] font-semibold text-text">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Importance</div>
                <p className="text-[12.5px] text-text-secondary leading-relaxed m-0">{selected.importance}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {selected.tags.map(t => (
                    <span key={t} className="text-[9px] px-2 py-1 rounded-md bg-card-hover border border-card-border text-text-secondary"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{t}</span>
                  ))}
                </div>

                <a href={`https://www.marinespecies.org/aphia.php?p=taxdetails&id=${selected.worms}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl border border-card-border text-[12px] font-semibold text-accent hover:bg-card-hover transition-colors">
                  <i className="ph ph-arrow-square-out" style={{ fontSize: 14 }} />
                  View on WoRMS
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-card-border rounded-2xl p-8 text-center" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
              <i className="ph ph-fish text-[40px] text-text-faint" />
              <div className="text-[14px] text-text-muted mt-3">Select a species to view details</div>
              <div className="text-[11px] text-text-faint mt-1">Click any card on the left</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
