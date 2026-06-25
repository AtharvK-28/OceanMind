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
    <div className={`absolute ${posClasses[position]} z-[1000] backdrop-blur-md rounded-xl px-4 py-3 shadow-lg`}
         style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(23,48,57,0.06)" }}>
      {title && <div className="text-[0.65rem] uppercase tracking-wider text-text-muted font-semibold mb-2">{title}</div>}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-[10.5px] text-[#3a4c4f]">
            <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
