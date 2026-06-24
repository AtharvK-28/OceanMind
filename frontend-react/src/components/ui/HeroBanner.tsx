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

export default function HeroBanner({ title, description, gradient = "from-[#064273] via-[#1a8a5c] to-[#0b3d2e]", stats }: Props) {
  return (
    <div className={`bg-gradient-to-br ${gradient} p-8 rounded-2xl mb-6 border border-white/[0.06]
                     shadow-lg shadow-black/30 animate-page-enter`}>
      <h1 className="text-2xl font-bold text-white m-0">{title}</h1>
      <p className="text-white/75 mt-1 text-[0.95rem] leading-relaxed max-w-3xl" dangerouslySetInnerHTML={{ __html: description }} />
      {stats && stats.length > 0 && (
        <div className="flex gap-10 mt-5 flex-wrap animate-stagger">
          {stats.map((s, i) => (
            <div key={i} className="text-center min-w-[80px]">
              <div className="text-3xl font-bold leading-tight animate-number" style={{ color: s.color || "#4fc3f7" }}>{s.value}</div>
              <div className="text-[0.7rem] uppercase tracking-wider text-white/50 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
