import { useEffect, useRef, useState } from 'react'
import { Search, ChevronDown, X, Loader2 } from 'lucide-react'
import { api } from '../../api/client'

/**
 * A "type to search, click to pick" dropdown — used anywhere a form needs
 * a patient_id / doctor_id / medicine_id / etc. instead of making people
 * remember and type raw numeric IDs.
 *
 * Props:
 *  - endpoint: API path to fetch options from, e.g. "/patients"
 *  - value / onChange: the selected id
 *  - getLabel(item): main text shown for an option (e.g. patient name)
 *  - getSubLabel(item): optional smaller secondary text (e.g. phone, specialty)
 *  - searchable: if true, sends ?search=<query> to the backend (server-side
 *    search). If false, fetches once and filters the list in the browser
 *    (used for small lists like Suppliers that don't have a search endpoint).
 *  - extraParams: extra query params to always send, e.g. { role: 'doctor' }
 */
export default function EntityPicker({
  endpoint,
  value,
  onChange,
  getLabel,
  getSubLabel,
  searchable = true,
  extraParams = {},
  placeholder = 'Search…',
  required,
  invalid,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [allOptions, setAllOptions] = useState([]) // used when searchable=false
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const boxRef = useRef(null)

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // If a value is passed in (e.g. editing an existing record), try to show
  // something readable instead of a bare number, once we have data loaded.
  useEffect(() => {
    if (!value) {
      setSelectedLabel('')
      return
    }
    const match = [...options, ...allOptions].find((o) => String(o.id) === String(value))
    if (match) setSelectedLabel(getLabel(match))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options, allOptions])

  async function search(q) {
    setLoading(true)
    try {
      if (searchable) {
        const res = await api.get(endpoint, { params: { ...extraParams, search: q, per_page: 8, page: 1 } })
        setOptions(res.data.data)
      } else {
        // fetch once, then filter client-side on every keystroke
        let list = allOptions
        if (list.length === 0) {
          const res = await api.get(endpoint, { params: extraParams })
          list = res.data.data
          setAllOptions(list)
        }
        const lower = q.toLowerCase()
        setOptions(list.filter((o) => getLabel(o).toLowerCase().includes(lower)))
      }
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  function handleFocus() {
    setOpen(true)
    if (options.length === 0) search(query)
  }

  function handleQueryChange(e) {
    const q = e.target.value
    setQuery(q)
    search(q)
  }

  function pick(option) {
    onChange(String(option.id))
    setSelectedLabel(getLabel(option))
    setQuery('')
    setOpen(false)
  }

  function clear() {
    onChange('')
    setSelectedLabel('')
    setQuery('')
  }

  return (
    <div className="relative" ref={boxRef}>
      {selectedLabel && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-ink hover:border-primary-400"
        >
          <span className="truncate">{selectedLabel} <span className="text-slate-400">#{value}</span></span>
          <span className="flex items-center gap-1 text-slate-400">
            <X size={14} onClick={(e) => { e.stopPropagation(); clear() }} className="hover:text-danger-500" />
          </span>
        </button>
      ) : (
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`w-full rounded-lg border bg-white py-2 pl-9 pr-8 text-sm text-ink placeholder:text-slate-400 focus:ring-1 outline-none ${
              invalid ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
            }`}
            placeholder={placeholder}
            value={query}
            onChange={handleQueryChange}
            onFocus={handleFocus}
          />
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-100 bg-white py-1 shadow-lg">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate">
              <Loader2 className="animate-spin" size={14} /> Searching…
            </div>
          )}
          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">No matches</div>
          )}
          {!loading &&
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => pick(option)}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-canvas"
              >
                <span className="text-ink">{getLabel(option)}</span>
                {getSubLabel && <span className="text-xs text-slate">{getSubLabel(option)}</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
