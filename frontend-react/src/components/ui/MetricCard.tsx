interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaColor?: "green" | "red" | "amber";
}

const deltaColors = {
  green: "text-green-400",
  red: "text-red-400",
  amber: "text-amber-400",
};

export default function MetricCard({ label, value, delta, deltaColor = "green" }: Props) {
  return (
    <div className="bg-gradient-to-br from-[#0e223d]/65 to-[#0a1628]/75 border border-[#4fc3f7]/12
                    rounded-xl p-4 backdrop-blur-sm
                    transition-all duration-200 hover:border-[#4fc3f7]/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4fc3f7]/5">
      <div className="text-[0.7rem] uppercase tracking-wider text-white/55 font-medium">{label}</div>
      <div className="text-2xl font-bold text-white mt-1 animate-number">{value}</div>
      {delta && <div className={`text-xs mt-1 ${deltaColors[deltaColor]}`}>{delta}</div>}
    </div>
  );
}
