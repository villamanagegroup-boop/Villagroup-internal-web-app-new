import { useNavigate } from 'react-router-dom'
import { format, parseISO, differenceInDays, isValid } from 'date-fns'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import InvoiceStatusBadge from './InvoiceStatusBadge'

function fmt(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return '—' }
}

function daysOverdue(dueDate) {
  if (!dueDate) return null
  const d = parseISO(dueDate)
  if (!isValid(d)) return null
  const diff = differenceInDays(new Date(), d)
  return diff > 0 ? diff : null
}

export default function InvoiceCard({ invoice, onMarkPaid }) {
  const navigate = useNavigate()
  const overdue = daysOverdue(invoice.due_date)
  const isOverdue = invoice.status !== 'paid' && overdue !== null

  return (
    <div
      onClick={() => navigate(`/billing/${invoice.id}`)}
      className={`bg-white rounded-2xl shadow-sm border cursor-pointer active:scale-[0.99] transition-transform p-4 ${
        isOverdue ? 'border-red-200 border-l-4 border-l-red-500' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {invoice.placement?.policyholder?.name ?? 'Unknown'}
          </p>
          <p className="text-xs text-gray-400">
            {invoice.invoice_number ?? `Invoice`} · {invoice.carrier_tpa_name ?? invoice.placement?.carrier_name}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-2xl font-bold text-navy leading-none">
            ${Number(invoice.total || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {invoice.status === 'paid'
              ? `Paid ${fmt(invoice.date_paid)}`
              : invoice.due_date
              ? isOverdue
                ? <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={10} /> {overdue}d overdue</span>
                : `Due ${fmt(invoice.due_date)}`
              : `Created ${fmt(invoice.created_at)}`
            }
          </p>
        </div>

        {/* One-tap mark as paid */}
        {invoice.status !== 'paid' && (
          <button
            onClick={e => { e.stopPropagation(); onMarkPaid(invoice.id) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors"
          >
            <CheckCircle size={14} /> Mark Paid
          </button>
        )}
      </div>

      {invoice.placement?.claim_number && (
        <p className="text-xs text-gray-400 mt-2">Claim #{invoice.placement.claim_number}</p>
      )}
    </div>
  )
}
