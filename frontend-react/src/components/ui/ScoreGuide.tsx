"use client";

const cardShadow = "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const serif = { fontFamily: "'Newsreader', serif" };

export interface ScoreBand {
  /** e.g. "70–100", "GREEN", "+4 °C and above" */
  range: string;
  label: string;
  color: string;
  /** What this band means in plain language. */
  meaning: string;
  /** What someone should actually do about it. */
  action: string;
}

export interface ScoreFactor {
  name: string;
  detail: string;
  /** Optional weight or contribution, e.g. "50%". */
  weight?: string;
}

/**
 * "What does this number mean?" — placed at the bottom of every page that
 * shows a model score. Judges and fishers both land on a page full of numbers
 * with no scale attached; this gives the scale, the drivers and the action
 * without needing anyone to explain it live.
 */
export default function ScoreGuide({
  title,
  intro,
  bands,
  factors,
  method,
  bandsHeading = "What the score means",
  factorsHeading = "What drives it",
}: {
  title: string;
  intro: string;
  bands: ScoreBand[];
  factors?: ScoreFactor[];
  method?: string;
  bandsHeading?: string;
  factorsHeading?: string;
}) {
  return (
    <div className="mt-6 bg-white border border-card-border rounded-2xl p-5 md:p-6" style={{ boxShadow: cardShadow }}>
      <div className="flex items-start gap-3 mb-5">
        <span className="w-10 h-10 flex-none rounded-xl bg-[#eaf3ef] text-accent flex items-center justify-center">
          <i className="ph ph-question text-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-text m-0" style={serif}>{title}</h3>
          <p className="text-[12.5px] text-text-secondary leading-relaxed mt-1 max-w-3xl">{intro}</p>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-[0.1em] text-text-muted mb-3" style={mono}>{bandsHeading}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {bands.map((b) => (
          <div key={b.label} className="rounded-xl border p-4 flex flex-col"
            style={{ borderColor: b.color + "40", background: b.color + "0d" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 flex-none rounded-full" style={{ background: b.color }} />
              <span className="text-[13px] font-semibold" style={{ color: b.color }}>{b.label}</span>
              <span className="ml-auto text-[10.5px] font-semibold" style={{ ...mono, color: b.color, opacity: 0.75 }}>{b.range}</span>
            </div>
            <p className="text-[11.5px] text-text-secondary leading-snug m-0">{b.meaning}</p>
            <p className="text-[11.5px] leading-snug mt-2 mb-0 pt-2 border-t" style={{ borderColor: b.color + "26", color: b.color }}>
              <b>Do:</b> {b.action}
            </p>
          </div>
        ))}
      </div>

      {factors && factors.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-[0.1em] text-text-muted mb-3" style={mono}>{factorsHeading}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 mb-5">
            {factors.map((f) => (
              <div key={f.name} className="flex items-start gap-3 py-1">
                <i className="ph ph-arrow-elbow-down-right text-[14px] text-accent flex-none mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[12.5px] font-semibold text-text">{f.name}</span>
                  {f.weight && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-card-hover text-text-muted" style={mono}>{f.weight}</span>
                  )}
                  <p className="text-[11.5px] text-text-secondary leading-snug m-0 mt-0.5">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {method && (
        <p className="text-[11px] text-text-faint leading-relaxed border-t border-[#f0ebdf] pt-3.5 m-0">{method}</p>
      )}
    </div>
  );
}
