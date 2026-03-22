import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { parseISO, format } from 'date-fns'
import { useBilling } from '../hooks/useBilling'
import NewInvoiceModal from '../components/billing/NewInvoiceModal'

const STATUSES = ['all', 'draft', 'sent', 'overdue', 'paid']

const INV_STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
}

function fmtDate(d) {
  try { return d ? format(parseISO(d), 'MM/dd/yy') : '—' } catch { return '—' }
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
    if (sort.field === 'total') {
      return sort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    }
    if (sort.field.includes('date') || sort.field === 'created_at') {
      aVal = aVal ? new Date(aVal) : new Date(sort.dir === 'asc' ? 9e15 : 0)
      bVal = bVal ? new Date(bVal) : new Date(sort.dir === 'asc' ? 9e15 : 0)
      return sort.dir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return sort.dir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })
}

export default function Billing() {
  const { invoices, summary, loading, error, refetch } = useBilling()
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' })
  const [showPanel, setShowPanel] = useState(false)
  const navigate = useNavigate()

  function toggleSort(field) {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const filtered = useMemo(() => {
    const list = status === 'all' ? invoices : invoices.filter(i => i.status === status)
    return sortList(list, sort)
  }, [invoices, status, sort])

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-400 mt-0.5">{invoices.length} invoices</p>
        </div>
        <button onClick={() => setShowPanel(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-navy to-navy-500 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all">
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {/* Summary strip */}
      {summary && !loading && (
        <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200/40 px-6 py-3 flex gap-6 shrink-0">
          <Stat label="Outstanding" value={`$${Number(summary.outstanding || 0).toLocaleString()}`} color="text-navy" />
          <Stat label="Overdue" value={`$${Number(summary.overdue || 0).toLocaleString()}`} color={summary.overdue > 0 ? 'text-red-600' : 'text-gray-600'} />
          <Stat label="Collected (30d)" value={`$${Number(summary.collectedThisMonth || 0).toLocaleString()}`} color="text-emerald-600" />
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                status === s ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
              }`}>
              {s === 'all' ? `All (${invoices.length})` : `${s} (${invoices.filter(i => i.status === s).length})`}
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
                <SortableTh field="invoice_number" sort={sort} onSort={toggleSort}>Invoice #</SortableTh>
                <SortableTh field="carrier_tpa_name" sort={sort} onSort={toggleSort}>Billed To</SortableTh>
                <SortableTh field="total" sort={sort} onSort={toggleSort}>Total</SortableTh>
                <SortableTh field="status" sort={sort} onSort={toggleSort}>Status</SortableTh>
                <SortableTh field="due_date" sort={sort} onSort={toggleSort}>Due Date</SortableTh>
                <SortableTh field="created_at" sort={sort} onSort={toggleSort}>Created</SortableTh>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {loading
                ? Array(5).fill(0).map((_, i) => (
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
                      {status === 'all' ? 'No invoices yet.' : `No ${status} invoices.`}
                    </td>
                  </tr>
                )
                : filtered.map(inv => (
                  <tr key={inv.id} onClick={() => navigate(`/billing/${inv.id}`)}
                    className="hover:bg-sky-50/30 cursor-pointer group transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{inv.invoice_number || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.carrier_tpa_name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">${Number(inv.total || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${INV_STATUS_STYLES[inv.status] || INV_STATUS_STYLES.draft}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{fmtDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{fmtDate(inv.created_at)}</td>
                    <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400"><ChevronRight size={16} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showPanel && (
        <NewInvoiceModal
          onClose={() => setShowPanel(false)}
          onCreated={inv => { setShowPanel(false); navigate(`/billing/${inv.id}`) }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-base font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}
