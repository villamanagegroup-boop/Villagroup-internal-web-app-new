import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bed, DollarSign, PawPrint, Accessibility, ChevronDown } from 'lucide-react'
import UnitStatusBadge from './UnitStatusBadge'

const STATUSES = ['available', 'occupied', 'reserved', 'inactive']

const TIER_LABELS = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' }

export default function UnitCard({ unit, onStatusChange }) {
  const navigate = useNavigate()
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [updating, setUpdating] = useState(false)

  async function handleStatus(e, newStatus) {
    e.stopPropagation()
    if (newStatus === unit.status) { setShowStatusMenu(false); return }
    setUpdating(true)
    await onStatusChange(unit.id, newStatus)
    setUpdating(false)
    setShowStatusMenu(false)
  }

  const coverPhoto = unit.photos?.sort((a, b) => a.sort_order - b.sort_order)[0]

  return (
    <div
      onClick={() => navigate(`/inventory/${unit.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Photo strip */}
      {coverPhoto ? (
        <div className="h-32 w-full overflow-hidden">
          <img src={coverPhoto.url} alt={unit.property_name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-24 w-full bg-navy-50 flex items-center justify-center">
          <MapPin size={24} className="text-navy-200" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{unit.property_name}</p>
            <p className="text-xs text-gray-400">{unit.unit_id}</p>
          </div>

          {/* One-tap status change */}
          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowStatusMenu(s => !s)}
              disabled={updating}
              className="flex items-center gap-1"
            >
              <UnitStatusBadge status={unit.status} />
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[120px]">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={(e) => handleStatus(e, s)}
                    className={`w-full text-left px-3 py-2 text-sm capitalize hover:bg-gray-50 ${unit.status === s ? 'font-semibold text-navy' : 'text-gray-700'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <MapPin size={11} />
          {unit.city}, {unit.state} {unit.zip}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Bed size={12} />
            {unit.bedrooms}bd / {unit.bathrooms}ba
          </span>
          {unit.daily_rate && (
            <span className="flex items-center gap-1">
              <DollarSign size={12} />
              ${Number(unit.daily_rate).toLocaleString()}/day
            </span>
          )}
          {unit.tier && (
            <span className="badge-blue">{TIER_LABELS[unit.tier]}</span>
          )}
          {unit.pet_friendly && (
            <span className="flex items-center gap-0.5 text-green-600">
              <PawPrint size={11} /> Pets OK
            </span>
          )}
          {unit.accessibility && (
            <span className="flex items-center gap-0.5 text-blue-600">
              <Accessibility size={11} /> Accessible
            </span>
          )}
          {!unit.ale_eligible && (
            <span className="badge-gray">Non-ALE</span>
          )}
        </div>
      </div>
    </div>
  )
}
