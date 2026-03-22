import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Download, RefreshCw, TrendingUp, DollarSign, Users, Building2 } from 'lucide-react'
import { useReports } from '../hooks/useReports'

function fmtMoney(n) { return `$${Number(n || 0).toLocaleString()}` }
function fmtDate(d) { try { return d ? format(parseISO(d + '-01'), 'MMM yyyy') : d } catch { return d } }

function downloadCSV(filename, headers, rows) {
  const escape = v => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function SummaryCard({ label, value, sub, icon: Icon, color = 'navy' }) {
  const colors = {
    navy: 'bg-navy text-white',
    green: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    red: 'bg-red-500 text-white',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <Icon size={18} className="opacity-60" />
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

function TableSection({ title, children, onExport }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {onExport && (
          <button onClick={onExport}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-navy transition-colors px-2 py-1 rounded-md hover:bg-gray-100">
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function Th({ children, right }) {
  return (
    <th className={`px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}
function Td({ children, right, className = '' }) {
  return <td className={`px-4 py-2.5 text-sm text-gray-700 ${right ? 'text-right tabular-nums' : ''} ${className}`}>{children}</td>
}

export default function Reports() {
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useReports()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <p className="font-medium">Could not load report data</p>
          <p className="mt-1 text-xs">{error}</p>
          <button onClick={refetch} className="mt-2 text-xs underline">Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Business intelligence & exports</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing || loading}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => {
              if (!data) return
              downloadCSV('villa-invoices.csv',
                ['Invoice #', 'Carrier / TPA', 'Total', 'Status', 'Due Date', 'Created'],
                data.rawInvoices.map(i => [i.invoice_number, i.carrier_tpa_name, i.total, i.status, i.due_date, i.created_at?.substring(0, 10)])
              )
            }}
            disabled={!data}
            className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50">
            <Download size={14} /> Export All Invoices
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Summary cards */}
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : data && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard label="Total Invoiced" value={fmtMoney(data.summary.totalInvoiced)} icon={DollarSign} color="navy" />
            <SummaryCard label="Total Collected" value={fmtMoney(data.summary.totalCollected)} icon={TrendingUp} color="green" />
            <SummaryCard label="Outstanding" value={fmtMoney(data.summary.totalOutstanding)} icon={DollarSign} sub="sent but unpaid" color="amber" />
            <SummaryCard label="Overdue" value={fmtMoney(data.summary.totalOverdue)} icon={DollarSign} sub="past due date" color={data.summary.totalOverdue > 0 ? 'red' : 'green'} />
            <SummaryCard label="Active Placements" value={data.summary.activePlacements} icon={Users} color="navy" />
            <SummaryCard label="Total Placements" value={data.summary.totalPlacements} icon={Users} sub="all time" color="navy" />
            <SummaryCard label="Total Units" value={data.summary.totalUnits} icon={Building2} sub="in inventory" color="navy" />
            <SummaryCard label="Collection Rate" value={data.summary.totalInvoiced > 0 ? `${Math.round(data.summary.totalCollected / data.summary.totalInvoiced * 100)}%` : '—'} icon={TrendingUp} color="green" />
          </div>
        )}

        {/* Monthly Revenue */}
        {data?.monthlyRevenue?.length > 0 && (
          <TableSection title="Monthly Revenue (Collected)"
            onExport={() => downloadCSV('monthly-revenue.csv',
              ['Month', 'Amount Collected'],
              data.monthlyRevenue.map(r => [fmtDate(r.month), r.amount])
            )}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Month</Th>
                  <Th right>Collected</Th>
                  <Th right>% of Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...data.monthlyRevenue].reverse().map(r => (
                  <tr key={r.month} className="hover:bg-gray-50">
                    <Td>{fmtDate(r.month)}</Td>
                    <Td right>{fmtMoney(r.amount)}</Td>
                    <Td right>{data.summary.totalCollected > 0 ? `${Math.round(r.amount / data.summary.totalCollected * 100)}%` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableSection>
        )}

        {/* Revenue by Carrier / TPA */}
        {data?.revenueByCarrier?.length > 0 && (
          <TableSection title="Revenue by Carrier / TPA"
            onExport={() => downloadCSV('revenue-by-carrier.csv',
              ['Carrier / TPA', 'Invoiced', 'Collected', '# Invoices'],
              data.revenueByCarrier.map(r => [r.name, r.invoiced, r.collected, r.invoiceCount])
            )}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Carrier / TPA</Th>
                  <Th right>Invoiced</Th>
                  <Th right>Collected</Th>
                  <Th right># Invoices</Th>
                  <Th right>Collection %</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.revenueByCarrier.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td className="font-medium">{r.name}</Td>
                    <Td right>{fmtMoney(r.invoiced)}</Td>
                    <Td right className="text-emerald-700">{fmtMoney(r.collected)}</Td>
                    <Td right>{r.invoiceCount}</Td>
                    <Td right>{r.invoiced > 0 ? `${Math.round(r.collected / r.invoiced * 100)}%` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableSection>
        )}

        {/* Adjuster Leaderboard */}
        {data?.adjusterLeaderboard?.length > 0 && (
          <TableSection title="Adjuster Leaderboard (by Placement Volume)"
            onExport={() => downloadCSV('adjuster-leaderboard.csv',
              ['Adjuster', 'Carrier', 'Total Placements', 'Active', 'Discharged'],
              data.adjusterLeaderboard.map(r => [r.name, r.carrier, r.total, r.active, r.discharged])
            )}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Rank</Th>
                  <Th>Adjuster</Th>
                  <Th>Carrier</Th>
                  <Th right>Total</Th>
                  <Th right>Active</Th>
                  <Th right>Discharged</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.adjusterLeaderboard.map((r, i) => (
                  <tr key={r.id} onClick={() => navigate(`/contacts/${r.id}`)}
                    className="hover:bg-gray-50 cursor-pointer">
                    <Td className="text-gray-400 font-mono">#{i + 1}</Td>
                    <Td className="font-medium text-navy underline">{r.name}</Td>
                    <Td>{r.carrier}</Td>
                    <Td right className="font-semibold">{r.total}</Td>
                    <Td right className="text-blue-700">{r.active || '—'}</Td>
                    <Td right className="text-emerald-700">{r.discharged || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableSection>
        )}

        {/* Unit Utilization */}
        {data?.unitUtilization?.length > 0 && (
          <TableSection title="Unit Utilization & Revenue"
            onExport={() => downloadCSV('unit-utilization.csv',
              ['Unit ID', 'Property', 'City', 'State', 'Total Placements', 'Active', 'Total Revenue'],
              data.unitUtilization.map(r => [r.unit_id, r.property_name, r.city, r.state, r.placements, r.active, r.revenue])
            )}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>Unit</Th>
                  <Th>Property</Th>
                  <Th>Location</Th>
                  <Th right>Placements</Th>
                  <Th right>Active</Th>
                  <Th right>Revenue</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.unitUtilization.map(r => (
                  <tr key={r.id} onClick={() => navigate(`/inventory/${r.id}`)}
                    className="hover:bg-gray-50 cursor-pointer">
                    <Td className="font-mono text-xs text-gray-500">{r.unit_id}</Td>
                    <Td className="font-medium text-navy underline">{r.property_name}</Td>
                    <Td>{r.city}, {r.state}</Td>
                    <Td right>{r.placements}</Td>
                    <Td right className="text-blue-700">{r.active || '—'}</Td>
                    <Td right className="font-semibold text-emerald-700">{fmtMoney(r.revenue)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableSection>
        )}

        {/* Placements by State */}
        {data?.placementsByState?.length > 0 && (
          <TableSection title="Placements by State"
            onExport={() => downloadCSV('placements-by-state.csv',
              ['State', 'Total Placements', 'Active'],
              data.placementsByState.map(r => [r.state, r.total, r.active])
            )}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <Th>State</Th>
                  <Th right>Total Placements</Th>
                  <Th right>Active</Th>
                  <Th right>Completed</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.placementsByState.map(r => (
                  <tr key={r.state} className="hover:bg-gray-50">
                    <Td className="font-medium">{r.state}</Td>
                    <Td right>{r.total}</Td>
                    <Td right className="text-blue-700">{r.active || '—'}</Td>
                    <Td right className="text-gray-400">{(r.total - r.active) || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableSection>
        )}

        {/* Full Placements Export */}
        {data && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Full Placements Export</p>
              <p className="text-xs text-gray-400 mt-0.5">All {data.rawPlacements.length} placements with policyholder, adjuster, unit, and dates</p>
            </div>
            <button
              onClick={() => downloadCSV('villa-placements.csv',
                ['Claim #', 'Policyholder', 'Carrier', 'Adjuster', 'Unit ID', 'Property', 'City', 'State', 'Status', 'Move-in', 'Move-out'],
                data.rawPlacements.map(p => [
                  p.claim_number, p.policyholder?.name, p.carrier_name,
                  p.adjuster?.name, p.unit?.unit_id, p.unit?.property_name,
                  p.unit?.city, p.unit?.state, p.status,
                  p.move_in_date, p.move_out_date,
                ])
              )}
              className="flex items-center gap-1.5 border border-gray-200 text-sm text-gray-600 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={14} /> Export CSV
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
