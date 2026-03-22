import { useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Send } from 'lucide-react'

function timeAgo(d) {
  try { return formatDistanceToNow(parseISO(d), { addSuffix: true }) } catch { return '' }
}

export default function NotesLog({ notes, onAdd }) {
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    await onAdd(body.trim())
    setBody('')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Add note */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="p-3 bg-navy text-white rounded-xl disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-gray-50 rounded-xl p-3">
              <p className="text-sm text-gray-700 leading-relaxed">{note.body}</p>
              <p className="text-xs text-gray-400 mt-1.5">
                {note.author} · {timeAgo(note.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
