import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { MapPin, Phone, Users } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ALEBar from './ALEBar'
import { aleColor } from '../../lib/aleUtils'

const BORDER_COLORS = {
  green: 'border-l-green-400',
  amber: 'border-l-amber-400',
  red: 'border-l-red-500',
  gray: 'border-l-gray-300',
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'MMM d, yyyy') } catch { return '—' }
}

export default function PlacementCard({ placement }) {
  const navigate = useNavigate()
  const color = aleColor(placement.ale_expiry_date)

  return (
    <div
      onClick={() => navigate(`/placements/${placement.id}`)}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${BORDER_COLORS[color]} p-4 cursor-pointer active:scale-[0.99] transition-transform`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {placement.policyholder?.name ?? 'Unknown'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Claim #{placement.claim_number}</p>
        </div>
        <StatusBadge status={placement.status} />
      </div>

      {/* Details row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        {placement.unit && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {placement.unit.property_name}, {placement.unit.city}
          </span>
        )}
        {placement.policyholder?.phone && (
          <span className="flex items-center gap-1">
            <Phone size={11} />
            {placement.policyholder.phone}
          </span>
        )}
        {placement.policyholder?.household_size && (
          <span className="flex items-center gap-1">
            <Users size={11} />
            {placement.policyholder.household_size} occupants
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="flex gap-4 text-xs text-gray-500 mb-3">
        <span>In: <span className="text-gray-700 font-medium">{fmt(placement.move_in_date)}</span></span>
        <span>Out: <span className="text-gray-700 font-medium">{fmt(placement.move_out_date)}</span></span>
        <span>Carrier: <span className="text-gray-700 font-medium">{placement.carrier_name}</span></span>
      </div>

      {/* ALE Bar */}
      <ALEBar placement={placement} compact />
    </div>
  )
}
