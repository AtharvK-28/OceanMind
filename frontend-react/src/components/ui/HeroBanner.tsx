interface HeroStat {
  value: string | number;
  label: string;
  color?: string;
}

interface Props {
  title: string;
  description: string;
  gradient?: string;
  stats?: HeroStat[];
}

export default function HeroBanner({ title, description, stats }: Props) {
  return (
    <div className="bg-white border border-[#ece5d6] rounded-2xl mb-6 p-6 animate-page-enter"
         style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 12px 30px rgba(23,48,57,0.04)" }}>
      <h1 className="text-[25px] font-semibold text-[#15323a] m-0" style={{ fontFamily: "'Newsreader', serif", letterSpacing: "-0.01em" }}>{title}</h1>
      <p className="text-[#6d7e80] mt-1 text-[13px] leading-relaxed max-w-3xl" dangerouslySetInnerHTML={{ __html: description }} />
      {stats && stats.length > 0 && (
        <div className="flex gap-10 mt-5 flex-wrap animate-stagger">
          {stats.map((s, i) => (
            <div key={i} className="text-center min-w-[80px]">
              <div className="text-3xl font-semibold leading-tight animate-number" style={{ color: s.color || "#1f7a8c", fontFamily: "'Newsreader', serif" }}>{s.value}</div>
              <div className="text-[9.5px] uppercase tracking-[0.1em] text-[#8a9698] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
