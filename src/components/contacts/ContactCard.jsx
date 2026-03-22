import { useNavigate } from 'react-router-dom'
import { Phone, Mail, Building2, AlertTriangle } from 'lucide-react'
import { differenceInDays, parseISO, isValid } from 'date-fns'

function coiWarning(date) {
  if (!date) return null
  const d = parseISO(date)
  if (!isValid(d)) return null
  const days = differenceInDays(d, new Date())
  if (days < 0) return 'expired'
  if (days <= 30) return 'soon'
  return null
}

const TYPE_LABELS = { adjuster: 'Adjuster', tpa: 'TPA', vendor: 'Vendor' }
const TYPE_COLORS = {
  adjuster: 'bg-blue-50 text-blue-700',
  tpa: 'bg-purple-50 text-purple-700',
  vendor: 'bg-gold-50 text-gold-600',
}

export default function ContactCard({ contact }) {
  const navigate = useNavigate()
  const coi = contact.type === 'vendor' ? coiWarning(contact.coi_expiration) : null

  const name = contact.type === 'tpa'
    ? (contact.company_name || contact.name)
    : contact.name

  const subtitle = contact.type === 'adjuster'
    ? contact.carrier
    : contact.type === 'tpa'
    ? contact.billing_contact
    : contact.company_name

  return (
    <div
      onClick={() => navigate(`/contacts/${contact.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{name}</p>
          {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {coi === 'expired' && (
            <span className="badge-red flex items-center gap-0.5">
              <AlertTriangle size={10} /> COI Expired
            </span>
          )}
          {coi === 'soon' && (
            <span className="badge-amber flex items-center gap-0.5">
              <AlertTriangle size={10} /> COI Soon
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[contact.type] ?? 'badge-gray'}`}>
            {TYPE_LABELS[contact.type]}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {contact.phone && (
          <span className="flex items-center gap-1"><Phone size={11} />{contact.phone}</span>
        )}
        {contact.email && (
          <span className="flex items-center gap-1 truncate"><Mail size={11} />{contact.email}</span>
        )}
      </div>
    </div>
  )
}
