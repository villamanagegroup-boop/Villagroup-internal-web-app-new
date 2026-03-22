import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { parseISO, format } from 'date-fns'
import { usePlacements } from '../hooks/usePlacements'
import NewPlacementModal from '../components/placements/NewPlacementModal'

const STATUSES = ['all', 'active', 'pending', 'closed']

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

  const filtered = useMemo(() => {
    const list = status === 'all' ? placements : placements.filter(p => p.status === status)
    return sortList(list, sort)
  }, [placements, status, sort])

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Placements</h1>
          <p className="text-sm text-gray-400 mt-0.5">{placements.length} total</p>
        </div>
        <button
          onClick={() => setShowPanel(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-navy to-navy-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all"
        >
          <Plus size={15} /> New Placement
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                status === s ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
              }`}>
              {s === 'all' ? `All (${placements.length})` : s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-xs text-red-600">{error} <button onClick={refetch} className="underline">Retry</button></span>}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
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
