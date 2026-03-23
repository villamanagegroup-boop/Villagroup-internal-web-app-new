import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useUnits } from '../hooks/useUnits'
import NewUnitModal from '../components/inventory/NewUnitModal'

const UNIT_STATUS_STYLES = {
  available: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  occupied: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  reserved: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  inactive: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
}

const DEFAULT_FILTERS = {
  status: 'all', beds: '', petFriendly: false, aleEligible: false,
}

function SortableTh({ children, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <th
      onClick={() => onSort(field)}
      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition-colors"
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
    if (typeof aVal === 'number' || typeof bVal === 'number') {
      return sort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    }
    return sort.dir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })
}

export default function Inventory() {
  const { units, loading, error, refetch } = useUnits()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState({ field: 'property_name', dir: 'asc' })
  const [showPanel, setShowPanel] = useState(false)
  const navigate = useNavigate()

  function toggleSort(field) {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const STATUSES = ['all', 'available', 'occupied', 'reserved', 'inactive']

  const filtered = useMemo(() => {
    const list = units.filter(u => {
      if (filters.status !== 'all' && u.status !== filters.status) return false
      if (filters.beds) {
        const b = filters.beds === '5+' ? 5 : Number(filters.beds)
        if (filters.beds === '5+' ? u.bedrooms < 5 : u.bedrooms !== b) return false
      }
      if (filters.petFriendly && !u.pet_friendly) return false
      if (filters.aleEligible && !u.ale_eligible) return false
      return true
    })
    return sortList(list, sort)
  }, [units, filters, sort])

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Housing Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">{units.length} units</p>
        </div>
        <button onClick={() => setShowPanel(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-navy to-navy-500 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all">
          <Plus size={15} />
          <span className="hidden sm:inline">New Unit</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 min-w-max">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilters(f => ({ ...f, status: s }))}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  filters.status === s ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
                }`}>
                {s === 'all' ? `All (${units.length})` : s}
              </button>
            ))}
          </div>
          <div className="ml-auto hidden md:flex items-center gap-3 shrink-0">
            {error && <span className="text-xs text-red-600">{error} <button onClick={refetch} className="underline">Retry</button></span>}
            <select value={filters.beds} onChange={e => setFilters(f => ({ ...f, beds: e.target.value }))}
              className="text-sm border border-gray-200/80 rounded-lg px-3 py-1.5 bg-white/70 text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="">Any beds</option>
              {['1','2','3','4','5+'].map(b => <option key={b} value={b}>{b} bd</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={filters.petFriendly} onChange={e => setFilters(f => ({ ...f, petFriendly: e.target.checked }))}
                className="rounded border-gray-300 text-navy" />
              Pet friendly
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={filters.aleEligible} onChange={e => setFilters(f => ({ ...f, aleEligible: e.target.checked }))}
                className="rounded border-gray-300 text-navy" />
              ALE eligible
            </label>
          </div>
        </div>
        {/* Mobile filters row */}
        <div className="md:hidden flex items-center gap-2">
          <select value={filters.beds} onChange={e => setFilters(f => ({ ...f, beds: e.target.value }))}
            className="text-sm border border-gray-200/80 rounded-lg px-2.5 py-1.5 bg-white/70 text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30">
            <option value="">Any beds</option>
            {['1','2','3','4','5+'].map(b => <option key={b} value={b}>{b} bd</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={filters.petFriendly} onChange={e => setFilters(f => ({ ...f, petFriendly: e.target.checked }))}
              className="rounded border-gray-300 text-navy" />
            Pets
          </label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={filters.aleEligible} onChange={e => setFilters(f => ({ ...f, aleEligible: e.target.checked }))}
              className="rounded border-gray-300 text-navy" />
            ALE
          </label>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex-1 overflow-auto p-4 space-y-2">
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100" />)
          : filtered.length === 0
          ? <p className="text-center text-sm text-gray-400 py-12">No units match your filters.</p>
          : filtered.map(u => (
            <div key={u.id} onClick={() => navigate(`/inventory/${u.id}`)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer active:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{u.property_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{u.city}, {u.state} · {u.bedrooms}bd/{u.bathrooms}ba</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize shrink-0 ${UNIT_STATUS_STYLES[u.status] || UNIT_STATUS_STYLES.inactive}`}>
                  {u.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-mono text-gray-400">{u.unit_id}</span>
                {u.ale_eligible && <span className="px-1.5 py-0.5 bg-navy/10 text-navy text-xs rounded font-medium">ALE</span>}
                {u.pet_friendly && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded font-medium">Pet</span>}
                {u.accessibility && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-xs rounded font-medium">ADA</span>}
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
                <SortableTh field="unit_id" sort={sort} onSort={toggleSort}>Unit ID</SortableTh>
                <SortableTh field="property_name" sort={sort} onSort={toggleSort}>Property</SortableTh>
                <SortableTh field="city" sort={sort} onSort={toggleSort}>Location</SortableTh>
                <SortableTh field="bedrooms" sort={sort} onSort={toggleSort}>Beds / Bath</SortableTh>
                <SortableTh field="status" sort={sort} onSort={toggleSort}>Status</SortableTh>
                <SortableTh field="tier" sort={sort} onSort={toggleSort}>Tier</SortableTh>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Flags</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100/80 rounded animate-pulse" /></td>
                      ))}
                      <td />
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                      No units match your filters.{' '}
                      <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-navy underline">Clear filters</button>
                    </td>
                  </tr>
                )
                : filtered.map(u => (
                  <tr key={u.id} onClick={() => navigate(`/inventory/${u.id}`)}
                    className="hover:bg-sky-50/30 cursor-pointer group transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{u.unit_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.property_name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.city}, {u.state}</td>
                    <td className="px-4 py-3 text-gray-500">{u.bedrooms}bd / {u.bathrooms}ba</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${UNIT_STATUS_STYLES[u.status] || UNIT_STATUS_STYLES.inactive}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.tier ? `T${u.tier}` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {u.ale_eligible && <span className="px-1.5 py-0.5 bg-navy/10 text-navy text-xs rounded font-medium">ALE</span>}
                        {u.pet_friendly && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded font-medium">Pet</span>}
                        {u.accessibility && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-xs rounded font-medium">ADA</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400"><ChevronRight size={16} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showPanel && (
        <NewUnitModal
          onClose={() => setShowPanel(false)}
          onCreated={u => { setShowPanel(false); navigate(`/inventory/${u.id}`) }}
        />
      )}
    </div>
  )
}
