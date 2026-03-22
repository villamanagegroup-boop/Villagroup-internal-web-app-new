import { aleColor, aleDaysLeft, aleRemaining, aleUsedPercent } from '../../lib/aleUtils'

const BAR_COLORS = {
  green: 'bg-green-500',
  amber: 'bg-amber-400',
  red: 'bg-red-500',
  gray: 'bg-gray-300',
}

const TEXT_COLORS = {
  green: 'text-green-700',
  amber: 'text-amber-700',
  red: 'text-red-700',
  gray: 'text-gray-500',
}

export default function ALEBar({ placement, compact = false }) {
  const color = aleColor(placement.ale_expiry_date)
  const daysLeft = aleDaysLeft(placement.ale_expiry_date)
  const remaining = aleRemaining(placement.ale_total_cap, placement.ale_running_total)
  const usedPct = aleUsedPercent(placement.ale_total_cap, placement.ale_running_total)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${BAR_COLORS[color]}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        {daysLeft !== null && (
          <span className={`text-xs font-medium flex-shrink-0 ${TEXT_COLORS[color]}`}>
            {daysLeft < 0 ? 'Expired' : `${daysLeft}d`}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">ALE Used</span>
        <span className={`font-medium ${TEXT_COLORS[color]}`}>
          {daysLeft === null ? 'No expiry set' : daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${BAR_COLORS[color]}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>${Number(placement.ale_running_total || 0).toLocaleString()} billed</span>
        {remaining !== null && (
          <span className={TEXT_COLORS[color]}>${remaining.toLocaleString()} remaining</span>
        )}
      </div>
    </div>
  )
}
