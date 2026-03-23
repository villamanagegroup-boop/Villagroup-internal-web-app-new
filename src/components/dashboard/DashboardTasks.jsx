import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { useTasks } from '../../hooks/useTasks'
import { useAuth } from '../../context/AuthContext'
import TaskDetailPanel from '../tasks/TaskDetailPanel'

const PRIORITY_BAR = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-sky-400',
}

const CATEGORY_BADGE = {
  placement: 'bg-blue-50 text-blue-700',
  contact:   'bg-emerald-50 text-emerald-700',
  inventory: 'bg-orange-50 text-orange-700',
  billing:   'bg-purple-50 text-purple-700',
  general:   'bg-gray-100 text-gray-500',
}

function DueLabel({ date }) {
  if (!date) return null
  try {
    const d = parseISO(date)
    const overdue = isPast(d) && !isToday(d)
    const today   = isToday(d)
    return (
      <span className={`flex items-center gap-0.5 text-xs ${overdue ? 'text-red-500 font-medium' : today ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
        {overdue && <AlertCircle size={10} />}
        {format(d, 'MMM d')}
      </span>
    )
  } catch { return null }
}

export default function DashboardTasks() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tasks, loading, updateTask } = useTasks()
  const [selectedTask, setSelectedTask] = useState(null)

  const myTasks = tasks
    .filter(t => t.assignee?.id === user?.id && t.status !== 'done')
    .slice(0, 6)

  async function quickComplete(e, task) {
    e.stopPropagation()
    await updateTask(task.id, {
      status: 'done',
      completed_at: new Date().toISOString(),
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-navy text-base">
          Your Tasks
          {myTasks.length > 0 && (
            <span className="ml-2 bg-navy text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
              {myTasks.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1 text-xs text-navy/60 hover:text-navy transition-colors font-medium"
        >
          View all <ArrowRight size={12} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="p-3 flex gap-3 items-center border-b border-gray-50 last:border-0">
              <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
            </div>
          ))
        ) : myTasks.length === 0 ? (
          <div className="p-4 flex items-center gap-3 text-emerald-600">
            <CheckCircle2 size={18} />
            <p className="text-sm font-medium">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myTasks.map(task => {
              const StatusIcon = task.status === 'in_progress' ? Clock : Circle
              const iconColor  = task.status === 'in_progress' ? 'text-blue-400' : 'text-gray-300 hover:text-gray-500'
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center cursor-pointer hover:bg-sky-50/40 transition-colors group"
                >
                  {/* Priority bar */}
                  <div className={`w-1 self-stretch shrink-0 ${PRIORITY_BAR[task.priority] || 'bg-gray-200'}`} />

                  {/* Quick-complete button */}
                  <button
                    onClick={e => quickComplete(e, task)}
                    className={`p-3 shrink-0 transition-colors ${iconColor}`}
                    title="Mark complete"
                  >
                    <StatusIcon size={16} strokeWidth={1.75} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 py-2.5 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.category && (
                        <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${CATEGORY_BADGE[task.category] || 'bg-gray-100 text-gray-500'}`}>
                          {task.category}
                        </span>
                      )}
                      <DueLabel date={task.due_date} />
                    </div>
                  </div>

                  <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-400 mr-3 shrink-0 transition-colors" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={updated => setSelectedTask(updated)}
        />
      )}
    </section>
  )
}
