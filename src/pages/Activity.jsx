import { useState, useEffect } from 'react'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { ArrowRightLeft, StickyNote, FileText, Building2, User, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ACTION_ICONS = {
  status_changed: ArrowRightLeft,
  note_added:     StickyNote,
  invoice_sent:   FileText,
  invoice_paid:   FileText,
}

const ENTITY_ICONS = {
  placement: User,
  unit:      Building2,
  invoice:   FileText,
  contact:   User,
}

function getIcon(item) {
  return ACTION_ICONS[item.action] ?? ENTITY_ICONS[item.entity_type] ?? ArrowRightLeft
}

function timeAgo(dateStr) {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) } catch { return '' }
}

function fmtDate(dateStr) {
  try { return format(parseISO(dateStr), 'MMM d, yyyy · h:mm a') } catch { return '' }
}

export default function Activity() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (err) setError(err.message)
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const sub = supabase
      .channel('activity-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, load)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Activity</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length > 0 ? `${items.length} recent events` : 'System activity log'}</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors px-3 py-2 rounded-lg hover:bg-navy/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            {error} <button onClick={load} className="underline ml-1">Retry</button>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm divide-y divide-gray-50/80">
          {loading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 flex gap-3 items-center">
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-50 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No activity recorded yet.</div>
          ) : (
            items.map(item => {
              const Icon = getIcon(item)
              return (
                <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-sky-50/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-navy-50 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.actor && (
                        <span className="font-medium text-gray-500">{item.actor} · </span>
                      )}
                      <span title={fmtDate(item.created_at)}>{timeAgo(item.created_at)}</span>
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
