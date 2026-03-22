import { format, parseISO } from 'date-fns'
import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react'

function fmt(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d') } catch { return '—' }
}

function Money({ value }) {
  return <span>${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
}

export default function BillingSummary({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard
        label="Billed This Month"
        icon={DollarSign}
        iconClass="bg-navy-50 text-navy"
        valueClass="text-navy"
      >
        <Money value={summary.billedThisMonth} />
      </SummaryCard>

      <SummaryCard
        label="Collected This Month"
        icon={TrendingUp}
        iconClass="bg-green-50 text-green-600"
        valueClass="text-green-700"
      >
        <Money value={summary.collectedThisMonth} />
      </SummaryCard>

      <SummaryCard
        label="Outstanding Balance"
        icon={AlertCircle}
        iconClass={summary.outstanding > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}
        valueClass={summary.outstanding > 0 ? 'text-amber-700' : 'text-gray-500'}
        warn={summary.outstanding > 0}
      >
        <Money value={summary.outstanding} />
      </SummaryCard>

      <SummaryCard
        label="Oldest Unpaid Due"
        icon={Clock}
        iconClass={summary.oldestUnpaid ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}
        valueClass={summary.oldestUnpaid ? 'text-red-600' : 'text-gray-400'}
      >
        {summary.oldestUnpaid ? fmt(summary.oldestUnpaid.due_date) : '—'}
      </SummaryCard>
    </div>
  )
}

function SummaryCard({ label, icon: Icon, iconClass, valueClass, warn, children }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${warn ? 'border-amber-200 ring-1 ring-amber-200' : 'border-gray-100'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${iconClass}`}>
        <Icon size={16} />
      </div>
      <p className={`text-xl font-bold leading-none ${valueClass}`}>{children}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
