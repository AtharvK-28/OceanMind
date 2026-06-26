"use client";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface SpeciesSeason {
  name: string;
  scientific: string;
  color: string;
  peak: number[];      // months (1-indexed) — commercial fishing peak
  spawning: number[];   // months when spawning
  avoid: number[];      // months to avoid (monsoon retreat, bans)
}

const SPECIES_SEASONS: SpeciesSeason[] = [
  { name: "Yellowfin Tuna",  scientific: "T. albacares",   color: "#d49a2e", peak: [3,4,5,11,12],      spawning: [3,4,5],    avoid: [7,8] },
  { name: "Skipjack Tuna",   scientific: "K. pelamis",     color: "#1f7a8c", peak: [11,12,1,2,3],      spawning: [1,2],      avoid: [6,7,8,9] },
  { name: "Indian Mackerel", scientific: "R. kanagurta",   color: "#3a8c5f", peak: [10,11,12,1,2],     spawning: [8,9,10],   avoid: [4,5] },
  { name: "Oil Sardine",     scientific: "S. longiceps",   color: "#c25a44", peak: [10,11,12,1],       spawning: [6,7,8],    avoid: [3,4,5] },
  { name: "Hilsa Shad",      scientific: "T. ilisha",      color: "#7e57c2", peak: [7,8,9,10,11],      spawning: [9,10],     avoid: [4,5,6] },
  { name: "Pomfret",         scientific: "P. argenteus",   color: "#5c6bc0", peak: [10,11,12,1,2],     spawning: [3,4],      avoid: [6,7] },
  { name: "Bombay Duck",     scientific: "H. nehereus",    color: "#8d6e63", peak: [10,11,12,1,2,3],   spawning: [1,2],      avoid: [7,8] },
];

interface Props {
  compact?: boolean;
  currentMonth?: number; // 0-indexed
}

export default function FishingCalendar({ compact = false, currentMonth }: Props) {
  const now = currentMonth ?? new Date().getMonth();

  return (
    <div className="bg-white border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h3 className="m-0 text-[16px] font-semibold text-[#15323a]" style={{ fontFamily: "'Newsreader', serif" }}>
            {compact ? "Fishing Calendar" : "Seasonal Fishing Calendar"}
          </h3>
          {!compact && <div className="text-[11.5px] text-text-muted mt-0.5">When to catch each species — Indian EEZ</div>}
        </div>
        <div className="flex gap-4 text-[9.5px]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <span className="flex items-center gap-1.5 text-text-secondary"><span className="w-4 h-3 rounded" style={{ background: "#3a8c5f" }} /> Peak catch</span>
          <span className="flex items-center gap-1.5 text-text-secondary"><span className="w-4 h-3 rounded" style={{ background: "#3a8c5f", opacity: 0.25 }} /> Spawning</span>
          <span className="flex items-center gap-1.5 text-text-secondary"><span className="w-4 h-3 rounded" style={{ background: "#c25a44", opacity: 0.2 }} /> Avoid</span>
          <span className="flex items-center gap-1.5 text-text-secondary"><span className="w-4 h-3 rounded border-2 border-accent" style={{ background: "transparent" }} /> Current</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: compact ? 600 : 700 }}>
          <thead>
            <tr>
              <th className="text-left px-5 py-2 text-[10px] text-text-muted uppercase tracking-wider sticky left-0 bg-white z-10" style={{ fontFamily: "'IBM Plex Mono', monospace", width: compact ? 120 : 150 }}>
                Species
              </th>
              {MONTHS.map((m, i) => (
                <th key={m} className="text-center px-0 py-2 text-[10px] uppercase tracking-wider" style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: i === now ? "#1f7a8c" : "#b0b9b9",
                  fontWeight: i === now ? 700 : 500,
                  width: compact ? 36 : 42,
                }}>
                  {m}
                  {i === now && <div className="w-1 h-1 rounded-full bg-accent mx-auto mt-0.5" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(compact ? SPECIES_SEASONS.slice(0, 5) : SPECIES_SEASONS).map((sp) => (
              <tr key={sp.name} className="border-t border-[#f0ebdf]">
                <td className="px-5 py-2.5 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: sp.color }} />
                    <div>
                      <div className="text-[12px] font-semibold text-text leading-tight">{sp.name}</div>
                      {!compact && <div className="text-[9.5px] text-text-faint italic">{sp.scientific}</div>}
                    </div>
                  </div>
                </td>
                {MONTHS.map((_, i) => {
                  const m = i + 1;
                  const isPeak = sp.peak.includes(m);
                  const isSpawning = sp.spawning.includes(m);
                  const isAvoid = sp.avoid.includes(m);
                  const isCurrent = i === now;

                  let bg = "transparent";
                  let opacity = 1;
                  if (isPeak) { bg = sp.color; opacity = 0.85; }
                  else if (isSpawning) { bg = sp.color; opacity = 0.25; }
                  else if (isAvoid) { bg = "#c25a44"; opacity = 0.12; }

                  return (
                    <td key={i} className="text-center px-0.5 py-2.5">
                      <div className="mx-auto rounded-md flex items-center justify-center" style={{
                        width: compact ? 28 : 34,
                        height: compact ? 18 : 22,
                        background: bg,
                        opacity,
                        border: isCurrent ? "2px solid #1f7a8c" : "none",
                        borderRadius: 6,
                      }}>
                        {isPeak && <i className="ph-fill ph-fish-simple" style={{ fontSize: 10, color: "white" }} />}
                        {isSpawning && !isPeak && <span className="text-[8px]" style={{ color: sp.color }}>●</span>}
                        {isAvoid && <i className="ph ph-x" style={{ fontSize: 8, color: "#c25a44" }} />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-2.5 border-t border-[#f0ebdf] text-[9.5px] text-text-faint" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        Sources: CMFRI catch statistics · IOTC stock assessments · IUCN species reports
      </div>
    </div>
  );
}

export { SPECIES_SEASONS };
