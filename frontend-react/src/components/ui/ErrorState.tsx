"use client";

/**
 * Friendly error card for data pages — replaces a silent empty map/chart when
 * an API call fails (e.g. backend cold-starting or offline during a demo).
 */
export default function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white border border-[#e8cabf] rounded-2xl text-center ${compact ? "p-6" : "p-10"}`}
      style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}
    >
      <i className={`ph ph-cloud-warning text-[#c25a44] ${compact ? "text-[32px]" : "text-[40px]"}`} />
      <p className="text-sm text-text mt-3 font-medium">{message ?? "Couldn't load this data"}</p>
      <p className="text-xs text-text-muted mt-1">The service may be starting up or offline — try again in a moment.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          <i className="ph ph-arrow-clockwise" /> Retry
        </button>
      )}
    </div>
  );
}
