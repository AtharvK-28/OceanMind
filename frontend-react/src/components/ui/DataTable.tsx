"use client";

interface Column {
  key: string;
  label: string;
  truncate?: number;
}

interface Props {
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  emptyMessage?: string;
  exportFilename?: string;
}

function downloadCSV(columns: Column[], data: any[], filename: string) {
  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = String(row[c.key] ?? "");
      return val.includes(",") ? `"${val}"` : val;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataTable({ columns, data, emptyMessage = "No data", exportFilename }: Props) {
  if (!data.length) return <div className="text-sm text-white/40 py-4 text-center">{emptyMessage}</div>;

  return (
    <div>
      {exportFilename && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => downloadCSV(columns, data, exportFilename)}
            className="text-xs text-white/40 hover:text-[#4fc3f7] transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-white/8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5">
              {columns.map((c) => (
                <th key={c.key} className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-white/50 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                {columns.map((c) => {
                  const val = String(row[c.key] ?? "—");
                  const display = c.truncate && val.length > c.truncate ? val.slice(0, c.truncate) + "…" : val;
                  return <td key={c.key} className="px-4 py-2.5 text-white/75">{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[0.65rem] text-white/25 mt-1.5 text-right">{data.length} rows</div>
    </div>
  );
}
