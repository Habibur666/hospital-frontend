import { Inbox, Loader2 } from 'lucide-react'

/**
 * Generic table. `columns` is an array of { key, label, render? }.
 * `actions` is an optional function(row) => JSX for row-level buttons.
 */
export default function DataTable({ columns, rows, loading, actions, emptyText = 'No records found' }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate">
        <Loader2 className="animate-spin" size={18} /> Loading…
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate">
        <Inbox size={28} className="text-slate-300" />
        <p className="text-sm">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                {col.label}
              </th>
            ))}
            {actions && <th className="px-4 py-3 text-right font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id ?? idx} className="border-b border-slate-50 last:border-0 hover:bg-canvas/60">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-ink">
                  {col.render ? col.render(row) : (row[col.key] ?? <span className="text-slate-300">—</span>)}
                </td>
              ))}
              {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
