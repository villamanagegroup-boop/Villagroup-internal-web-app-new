import { format, parseISO } from 'date-fns'
import { ArrowRightLeft, StickyNote, FileText, Plus, CheckCircle } from 'lucide-react'

const ACTION_ICONS = {
  status_changed: ArrowRightLeft,
  note_added: StickyNote,
  invoice_sent: FileText,
  invoice_paid: CheckCircle,
  created: Plus,
}

const ACTION_COLORS = {
  status_changed: 'bg-blue-50 text-blue-600',
  note_added: 'bg-yellow-50 text-yellow-600',
  invoice_sent: 'bg-purple-50 text-purple-600',
  invoice_paid: 'bg-green-50 text-green-600',
  created: 'bg-navy-50 text-navy',
}

function fmt(d) {
  try { return format(parseISO(d), 'MMM d, yyyy · h:mm a') } catch { return '' }
}

export default function ActivityTimeline({ activity }) {
  if (!activity || activity.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No activity yet.</p>
  }

  return (
    <div className="relative pl-6 space-y-4">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-200" />

      {activity.map((item, i) => {
        const Icon = ACTION_ICONS[item.action] ?? ArrowRightLeft
        const iconClass = ACTION_COLORS[item.action] ?? 'bg-gray-100 text-gray-500'

        return (
          <div key={item.id} className="relative flex items-start gap-3">
            {/* Icon dot */}
            <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
              <Icon size={11} />
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <p className="text-sm text-gray-700 leading-snug">{item.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.actor} · {fmt(item.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
