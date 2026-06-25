interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaColor?: "green" | "red" | "amber";
  icon?: string;
}

const dotColors = { green: "#3a8c5f", red: "#c25a44", amber: "#d49a2e" };

export default function MetricCard({ label, value, delta, deltaColor = "green", icon }: Props) {
  return (
    <div className="bg-white border border-[#ece5d6] rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
         style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04), 0 10px 26px rgba(23,48,57,0.035)" }}>
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] tracking-[0.11em] uppercase text-[#8a9698]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
        {icon && <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center bg-[#eaf3ef] text-[#2f6f4c]"><i className={icon} style={{ fontSize: 16 }} /></span>}
      </div>
      <div className="flex items-baseline gap-1 mt-3">
        <span className="text-[34px] font-semibold leading-none text-[#16323a] animate-number" style={{ fontFamily: "'Newsreader', serif" }}>{value}</span>
      </div>
      {delta && (
        <div className="flex items-center gap-[6px] mt-[10px]">
          <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: dotColors[deltaColor] }} />
          <span className="text-[11.5px] text-[#6d7e80]">{delta}</span>
        </div>
      )}
    </div>
  );
}
