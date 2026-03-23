import { useState, useMemo } from 'react'
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Search, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../context/AuthContext'
import { canDelete } from '../context/AuthContext'
import TaskFormPanel from '../components/tasks/TaskFormPanel'
import TaskDetailPanel from '../components/tasks/TaskDetailPanel'

const STATUS_TABS = [
  { id: 'all',         label: 'All' },
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done',        label: 'Done' },
]

const PRIORITY_BAR = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-sky-400',
}

const PRIORITY_BADGE = {
  high:   'bg-red-50 text-red-600 ring-1 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  low:    'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
}

const CATEGORY_BADGE = {
  placement: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  contact:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inventory: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  billing:   'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  general:   'bg-gray-100 text-gray-500',
}

const STATUS_NEXT = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function DueLabel({ date }) {
  if (!date) return null
  try {
    const d = parseISO(date)
    const overdue = isPast(d) && !isToday(d)
    const today   = isToday(d)
    return (
      <span className={`flex items-center gap-0.5 text-xs ${overdue ? 'text-red-600 font-medium' : today ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
        {overdue && <AlertCircle size={11} />}
        {format(d, 'MMM d')}
      </span>
    )
  } catch { return null }
}

function TaskCard({ task, currentUserId, role, onCycleStatus, onEdit, onDelete, onOpen }) {
  const StatusIcon =
    task.status === 'done'        ? CheckCircle2 :
    task.status === 'in_progress' ? Clock        : Circle

  const statusColor =
    task.status === 'done'        ? 'text-emerald-500' :
    task.status === 'in_progress' ? 'text-blue-500'    :
    'text-gray-300 hover:text-gray-400'

  const canEdit = task.assignee?.id === currentUserId || task.creator?.id === currentUserId || canDelete(role)

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm flex items-stretch overflow-hidden group transition-shadow hover:shadow-md ${task.status === 'done' ? 'opacity-55' : ''}`}>
      {/* Priority bar */}
      <div className={`w-1 shrink-0 ${PRIORITY_BAR[task.priority] || 'bg-gray-200'}`} />

      {/* Status toggle */}
      <button
        onClick={onCycleStatus}
        title={`Mark as: ${STATUS_NEXT[task.status]?.replace('_', ' ')}`}
        className={`px-4 flex items-center self-stretch shrink-0 transition-colors ${statusColor}`}
      >
        <StatusIcon size={20} strokeWidth={1.8} />
      </button>

      {/* Content — clickable to open detail */}
      <div className="flex-1 py-3 pr-3 min-w-0 cursor-pointer" onClick={onOpen}>
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium text-gray-900 leading-snug ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {task.priority && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${PRIORITY_BADGE[task.priority]}`}>
                {task.priority}
              </span>
            )}
            {task.category && (
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${CATEGORY_BADGE[task.category]}`}>
                {task.category}
              </span>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {task.linked_label && (
            <span className="text-xs text-gray-400 truncate max-w-[180px]" title={task.linked_label}>
              ↗ {task.linked_label}
            </span>
          )}
          {task.assignee ? (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-navy/60 to-navy/30 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {initials(task.assignee.full_name)}
              </span>
              {task.assignee.full_name}
            </span>
          ) : (
            <span className="text-xs text-gray-300 italic">Unassigned</span>
          )}
          <DueLabel date={task.due_date} />
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-0.5 pr-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-navy hover:bg-navy/5 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          {canDelete(role) && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Tasks() {
  const { user, role } = useAuth()
  const { tasks, loading, error, refetch, updateTask, deleteTask } = useTasks()
  const [statusTab, setStatusTab]       = useState('all')
  const [myTasks, setMyTasks]           = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch]             = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [editTask, setEditTask]         = useState(null)
  const [detailTask, setDetailTask]     = useState(null)

  const counts = useMemo(() => ({
    all:         tasks.length,
    todo:        tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
  }), [tasks])

  const filtered = useMemo(() => {
    let list = tasks
    if (statusTab !== 'all') list = list.filter(t => t.status === statusTab)
    if (myTasks) list = list.filter(t => t.assignee?.id === user?.id)
    if (categoryFilter) list = list.filter(t => t.category === categoryFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.linked_label?.toLowerCase().includes(q) ||
        t.assignee?.full_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [tasks, statusTab, myTasks, categoryFilter, search, user])

  async function cycleStatus(task) {
    const next = STATUS_NEXT[task.status]
    await updateTask(task.id, {
      status: next,
      completed_at: next === 'done' ? new Date().toISOString() : null,
    })
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) return
    await deleteTask(id)
  }

  function openEdit(task) {
    setEditTask(task)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditTask(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tasks.length} total</p>
        </div>
        <button
          onClick={() => { setEditTask(null); setShowForm(true) }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-navy to-navy-500 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar space-y-2">
        <div className="flex items-center gap-2">
          <div className="overflow-x-auto scrollbar-none flex-1">
            <div className="flex items-center gap-0.5 min-w-max">
              {STATUS_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setStatusTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    statusTab === t.id ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 text-xs ${statusTab === t.id ? 'text-navy/60' : 'text-gray-400'}`}>
                    {counts[t.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMyTasks(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                myTasks ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              My Tasks
            </button>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 text-gray-600"
            >
              <option value="">All Categories</option>
              <option value="placement">Placement</option>
              <option value="contact">Contact</option>
              <option value="inventory">Inventory</option>
              <option value="billing">Billing</option>
              <option value="general">General</option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white/70 focus:outline-none focus:ring-2 focus:ring-navy/30 w-48" />
            </div>
          </div>
        </div>
        {/* Mobile filters */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMyTasks(v => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              myTasks ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            Mine
          </button>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 text-gray-600 flex-1"
          >
            <option value="">All Categories</option>
            <option value="placement">Placement</option>
            <option value="contact">Contact</option>
            <option value="inventory">Inventory</option>
            <option value="billing">Billing</option>
            <option value="general">General</option>
          </select>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white/70 focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            {error} <button onClick={refetch} className="underline ml-1">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2.5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-[72px] bg-white/60 rounded-xl animate-pulse border border-white/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CheckCircle2 size={44} className="text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No tasks found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || myTasks || categoryFilter
                ? 'Try clearing your filters'
                : 'Click "+ New Task" to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={user?.id}
                role={role}
                onCycleStatus={() => cycleStatus(task)}
                onEdit={() => openEdit(task)}
                onDelete={() => handleDelete(task.id)}
                onOpen={() => setDetailTask(task)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TaskFormPanel
          task={editTask}
          onClose={closeForm}
          onSaved={closeForm}
        />
      )}

      {detailTask && !showForm && (
        <TaskDetailPanel
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdated={updated => setDetailTask(updated)}
        />
      )}
    </div>
  )
}
