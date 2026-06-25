export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-text-muted animate-page-enter">
      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function DataTransition({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  return (
    <div className={`transition-opacity duration-300 ${loading ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
      {children}
    </div>
  );
}
