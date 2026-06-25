export function SkeletonCard() {
  return (
    <div className="bg-white border border-card-border rounded-2xl p-4" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-8 w-24 mb-2" />
      <div className="skeleton h-2 w-16" />
    </div>
  );
}

export function SkeletonMap() {
  return (
    <div className="skeleton rounded-xl" style={{ height: "480px" }} />
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white border border-card-border rounded-2xl p-5" style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
      <div className="skeleton h-3 w-32 mb-4" />
      <div className="flex items-end gap-2 h-[200px] pt-8">
        {[60, 85, 45, 70, 90, 55, 75, 40].map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 animate-stagger" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
