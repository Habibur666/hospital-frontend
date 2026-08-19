import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.total_pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate">
      <span>
        Page {meta.page} of {meta.total_pages} · {meta.total_items} total
      </span>
      <div className="flex gap-1.5">
        <button
          disabled={!meta.has_prev}
          onClick={() => onPageChange(meta.page - 1)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40 hover:bg-canvas"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <button
          disabled={!meta.has_next}
          onClick={() => onPageChange(meta.page + 1)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 disabled:opacity-40 hover:bg-canvas"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
