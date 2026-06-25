"use client";

interface Column { key: string; label: string; truncate?: number }
interface Props { columns: Column[]; data: any[]; emptyMessage?: string; exportFilename?: string }

function downloadCSV(columns: Column[], data: any[], filename: string) {
  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns.map((c) => { const val = String(row[c.key] ?? ""); return val.includes(",") ? `"${val}"` : val; }).join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function DataTable({ columns, data, emptyMessage = "No data", exportFilename }: Props) {
  if (!data.length) return <div className="text-sm text-text-muted py-4 text-center">{emptyMessage}</div>;

  return (
    <div>
      {exportFilename && (
        <div className="flex justify-end mb-2">
          <button onClick={() => downloadCSV(columns, data, exportFilename)}
            className="text-xs text-text-muted hover:text-accent transition-colors flex items-center gap-1.5">
            <i className="ph ph-download-simple text-sm" /> Export CSV
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-card-border bg-white"
           style={{ boxShadow: "0 1px 2px rgba(23,48,57,0.04)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f5f1e8]">
              {columns.map((c) => (
                <th key={c.key} className="text-left px-4 py-2.5 text-[9.5px] uppercase tracking-wider text-text-muted font-semibold"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-[#f0ebdf] hover:bg-[#faf7f0] transition-colors">
                {columns.map((c) => {
                  const val = String(row[c.key] ?? "—");
                  const display = c.truncate && val.length > c.truncate ? val.slice(0, c.truncate) + "…" : val;
                  return <td key={c.key} className="px-4 py-2.5 text-[#46585b]">{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-text-faint mt-1.5 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{data.length} rows</div>
    </div>
  );
}
