import { format, parseISO } from 'date-fns'
import { CheckCircle2, Circle } from 'lucide-react'

function fmt(d) {
  try { return format(parseISO(d), 'MMM d, h:mm a') } catch { return '' }
}

export default function MoveInChecklist({ checklists, onToggle }) {
  if (!checklists || checklists.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">No checklists found.</div>
    )
  }

  return (
    <div className="space-y-5">
      {checklists.map(checklist => {
        const total = checklist.items?.length ?? 0
        const done = checklist.items?.filter(i => i.completed).length ?? 0

        return (
          <div key={checklist.id}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 capitalize">
                {checklist.type.replace('_', '-')} Checklist
              </h4>
              <span className="text-xs text-gray-400">{done}/{total} done</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
              />
            </div>

            <div className="space-y-1">
              {checklist.items?.map(item => (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id, !item.completed)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  {item.completed
                    ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    : <Circle size={20} className="text-gray-300 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.label}
                    </p>
                    {item.completed && item.completed_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.completed_by ?? 'Staff'} · {fmt(item.completed_at)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
