import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { parseISO, format } from 'date-fns'
import { usePlacements } from '../hooks/usePlacements'
import NewPlacementModal from '../components/placements/NewPlacementModal'

const STATUSES = ['all', 'active', 'pending', 'closed', 'archived']

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  closed: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
}

function fmtDate(d) {
  try { return d ? format(parseISO(d), 'MM/dd/yy') : '—' } catch { return '—' }
}

function SortableTh({ children, field, sort, onSort, className = '' }) {
  const active = sort.field === field
  return (
    <th
      onClick={() => onSort(field)}
      className={`text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition-colors ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active
          ? (sort.dir === 'asc' ? <ChevronUp size={11} className="text-navy" /> : <ChevronDown size={11} className="text-navy" />)
          : <ChevronsUpDown size={11} className="opacity-25" />}
      </span>
    </th>
  )
}

function sortList(list, sort) {
  if (!sort.field) return list
  return [...list].sort((a, b) => {
    let aVal = a[sort.field] ?? ''
    let bVal = b[sort.field] ?? ''
    if (sort.field.includes('date')) {
      aVal = aVal ? new Date(aVal) : new Date(sort.dir === 'asc' ? 9e15 : 0)
      bVal = bVal ? new Date(bVal) : new Date(sort.dir === 'asc' ? 9e15 : 0)
      return sort.dir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return sort.dir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })
}

export default function Placements() {
  const { placements, loading, error, refetch } = usePlacements()
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ field: 'move_in_date', dir: 'desc' })
  const [showPanel, setShowPanel] = useState(false)
  const navigate = useNavigate()

  function toggleSort(field) {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const nonArchived = useMemo(() => placements.filter(p => p.status !== 'archived'), [placements])

  const filtered = useMemo(() => {
    const list = status === 'all'
      ? nonArchived
      : placements.filter(p => p.status === status)
    return sortList(list, sort)
  }, [placements, nonArchived, status, sort])

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Placements</h1>
          <p className="text-sm text-gray-400 mt-0.5">{nonArchived.length} total</p>
        </div>
        <button
          onClick={() => setShowPanel(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-navy to-navy-500 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">New Placement</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 min-w-max">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  status === s ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
                }`}>
                {s === 'all' ? `All (${nonArchived.length})` : s === 'archived' ? `Archived (${placements.filter(p => p.status === 'archived').length})` : s}
              </button>
            ))}
          </div>
          {error && <span className="text-xs text-red-600 shrink-0 ml-auto">{error} <button onClick={refetch} className="underline">Retry</button></span>}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex-1 overflow-auto p-4 space-y-2">
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100" />)
          : filtered.length === 0
          ? <p className="text-center text-sm text-gray-400 py-12">No placements found.</p>
          : filtered.map(p => (
            <div key={p.id} onClick={() => navigate(`/placements/${p.id}`)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer active:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.policyholder_name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{p.claim_number || '—'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize shrink-0 ${STATUS_STYLES[p.status] || STATUS_STYLES.closed}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                <span>{p.carrier_name || '—'}</span>
                <span className="text-gray-300">·</span>
                <span>In: {fmtDate(p.move_in_date)}</span>
                {p.ale_expiry_date && <><span className="text-gray-300">·</span><span>ALE: {fmtDate(p.ale_expiry_date)}</span></>}
              </div>
            </div>
          ))
        }
      </div>

      {/* Desktop table */}
      <div className="hidden md:block flex-1 overflow-auto p-6">
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-sky-50/40">
                <SortableTh field="policyholder_name" sort={sort} onSort={toggleSort}>Policyholder</SortableTh>
                <SortableTh field="claim_number" sort={sort} onSort={toggleSort}>Claim #</SortableTh>
                <SortableTh field="carrier_name" sort={sort} onSort={toggleSort}>Carrier</SortableTh>
                <SortableTh field="status" sort={sort} onSort={toggleSort}>Status</SortableTh>
                <SortableTh field="move_in_date" sort={sort} onSort={toggleSort}>Move-in</SortableTh>
                <SortableTh field="ale_expiry_date" sort={sort} onSort={toggleSort}>ALE Expiry</SortableTh>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {loading
                ? Array(6).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100/80 rounded animate-pulse" /></td>
                      ))}
                      <td />
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      No placements found.{status !== 'all' && <button onClick={() => setStatus('all')} className="ml-1 text-navy underline">Show all</button>}
                    </td>
                  </tr>
                )
                : filtered.map(p => (
                  <tr key={p.id} onClick={() => navigate(`/placements/${p.id}`)}
                    className="hover:bg-sky-50/30 cursor-pointer group transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.policyholder_name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.claim_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.carrier_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${STATUS_STYLES[p.status] || STATUS_STYLES.closed}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{fmtDate(p.move_in_date)}</td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{fmtDate(p.ale_expiry_date)}</td>
                    <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400"><ChevronRight size={16} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showPanel && (
        <NewPlacementModal
          onClose={() => setShowPanel(false)}
          onCreated={p => { setShowPanel(false); navigate(`/placements/${p.id}`) }}
        />
      )}
    </div>
  )
}
