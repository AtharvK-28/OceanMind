interface LegendItem {
  color: string;
  label: string;
}

interface Props {
  title: string;
  items: LegendItem[];
  position?: "bottom-left" | "bottom-right" | "top-right";
}

const posClasses = {
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "top-right": "top-4 right-4",
};

export default function MapLegend({ title, items, position = "bottom-left" }: Props) {
  return (
    <div className={`absolute ${posClasses[position]} z-[1000] bg-[#0a1628]/90 backdrop-blur-md
                     border border-white/10 rounded-xl px-4 py-3 shadow-lg`}>
      <div className="text-[0.65rem] uppercase tracking-wider text-white/50 font-semibold mb-2">{title}</div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-white/75">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
