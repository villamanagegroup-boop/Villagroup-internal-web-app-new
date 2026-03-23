import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Pencil, ExternalLink, CheckCircle2, Circle, Clock, AlertCircle, Calendar, User, Tag } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { canDelete } from '../../context/AuthContext'
import TaskFormPanel from './TaskFormPanel'

const PRIORITY_STYLES = {
  high:   { bar: 'bg-red-500',   badge: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
  medium: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  low:    { bar: 'bg-sky-400',   badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
}

const CATEGORY_STYLES = {
  placement: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  contact:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inventory: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  billing:   'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  general:   'bg-gray-100 text-gray-500',
}

const LINKED_ROUTES = {
  placement: '/placements',
  contact:   '/contacts',
  inventory: '/inventory',
  billing:   '/billing',
}

const STATUS_NEXT   = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

const TASK_SELECT = `
  id, title, description, status, priority, category,
  linked_id, linked_label, due_date, completed_at, created_at,
  assignee:assigned_to (id, full_name),
  creator:created_by (id, full_name)
`

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function TaskDetailPanel({ task: initialTask, onClose, onUpdated }) {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [task, setTask] = useState(initialTask)
  const [showEdit, setShowEdit] = useState(false)
  const [cycling, setCycling] = useState(false)

  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
  const canEdit = task.assignee?.id === user?.id || task.creator?.id === user?.id || canDelete(role)

  async function cycleStatus() {
    if (cycling) return
    setCycling(true)
    const next = STATUS_NEXT[task.status]
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: next,
          completed_at: next === 'done' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .select(TASK_SELECT)
        .single()
      if (!error && data) {
        setTask(data)
        onUpdated?.(data)
      }
    } finally {
      setCycling(false)
    }
  }

  function navigateToLinked() {
    const route = LINKED_ROUTES[task.category]
    if (route && task.linked_id) {
      onClose()
      navigate(`${route}/${task.linked_id}`)
    }
  }

  const StatusIcon = task.status === 'done' ? CheckCircle2 : task.status === 'in_progress' ? Clock : Circle
  const statusColor =
    task.status === 'done'        ? 'text-emerald-500' :
    task.status === 'in_progress' ? 'text-blue-500'    : 'text-gray-400'
  const nextLabel = STATUS_LABELS[STATUS_NEXT[task.status]]

  let dueNode = null
  if (task.due_date) {
    try {
      const d = parseISO(task.due_date)
      const overdue = isPast(d) && !isToday(d) && task.status !== 'done'
      const today   = isToday(d)
      dueNode = (
        <span className={`flex items-center gap-1 text-sm ${overdue ? 'text-red-600 font-medium' : today ? 'text-amber-600 font-medium' : 'text-gray-700'}`}>
          {overdue && <AlertCircle size={13} />}
          {format(d, 'MMMM d, yyyy')}
          {overdue ? ' — overdue' : today ? ' — today' : ''}
        </span>
      )
    } catch {}
  }

  if (showEdit) {
    return (
      <TaskFormPanel
        task={task}
        onClose={() => setShowEdit(false)}
        onSaved={updated => {
          setTask(updated)
          onUpdated?.(updated)
          setShowEdit(false)
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">

        {/* Priority accent bar */}
        <div className={`h-1 w-full shrink-0 ${priority.bar}`} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {task.priority && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${priority.badge}`}>
                  {task.priority}
                </span>
              )}
              {task.category && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${CATEGORY_STYLES[task.category]}`}>
                  {task.category}
                </span>
              )}
            </div>
            <h2 className={`text-base font-semibold leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </h2>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {canEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-navy hover:bg-navy/5 transition-colors"
                title="Edit task"
              >
                <Pencil size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Status action block */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <div className="flex items-center gap-2.5">
              <StatusIcon size={20} className={statusColor} strokeWidth={1.8} />
              <span className="text-sm font-medium text-gray-700">{STATUS_LABELS[task.status]}</span>
            </div>
            <button
              onClick={cycleStatus}
              disabled={cycling}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                task.status === 'done'
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  : 'bg-navy text-white hover:bg-navy-700'
              }`}
            >
              {cycling ? '...' : `Mark as ${nextLabel}`}
            </button>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Linked record */}
          {task.linked_label && task.linked_id && LINKED_ROUTES[task.category] && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Linked {task.category}
              </p>
              <button
                onClick={navigateToLinked}
                className="flex items-center gap-2 text-sm text-navy font-medium hover:underline group"
              >
                <span className="w-6 h-6 rounded-md bg-navy/8 flex items-center justify-center group-hover:bg-navy/12 transition-colors">
                  <ExternalLink size={12} className="text-navy" />
                </span>
                {task.linked_label}
              </button>
            </div>
          )}

          {/* Details */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</p>
            <div className="space-y-3">

              <div className="flex items-start gap-3">
                <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Assigned to</p>
                  {task.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-navy/60 to-navy/30 flex items-center justify-center text-[9px] font-bold text-white">
                        {initials(task.assignee.full_name)}
                      </span>
                      <span className="text-sm text-gray-800 font-medium">{task.assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Unassigned</span>
                  )}
                </div>
              </div>

              {task.due_date && (
                <div className="flex items-start gap-3">
                  <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Due date</p>
                    {dueNode}
                  </div>
                </div>
              )}

              {task.creator && (
                <div className="flex items-start gap-3">
                  <Tag size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Created by</p>
                    <span className="text-sm text-gray-700">{task.creator.full_name}</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
