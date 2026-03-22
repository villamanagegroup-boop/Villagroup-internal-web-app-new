import { formatDistanceToNow, parseISO } from 'date-fns'
import {
  ArrowRightLeft,
  StickyNote,
  FileText,
  Building2,
  User,
} from 'lucide-react'

const ACTION_ICONS = {
  status_changed: ArrowRightLeft,
  note_added: StickyNote,
  invoice_sent: FileText,
  invoice_paid: FileText,
}

const ENTITY_ICONS = {
  placement: User,
  unit: Building2,
  invoice: FileText,
  contact: User,
}

function getIcon(item) {
  return ACTION_ICONS[item.action] ?? ENTITY_ICONS[item.entity_type] ?? ArrowRightLeft
}

function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

export default function RecentActivity({ items, loading }) {
  return (
    <section className="pb-2">
      <h2 className="font-display font-semibold text-navy text-base mb-3">Recent Activity</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="p-3 flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-400 text-center">No recent activity</div>
        ) : (
          items.map(item => {
            const Icon = getIcon(item)
            return (
              <div key={item.id} className="p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.actor} · {timeAgo(item.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
