import { useState, useEffect } from 'react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES = [
  { value: 'placement', label: 'Placement' },
  { value: 'contact',   label: 'Contact' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'billing',   label: 'Billing' },
  { value: 'general',   label: 'General' },
]

const PRIORITIES = [
  { value: 'low',    label: 'Low',    active: 'bg-sky-500 text-white',    inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  { value: 'medium', label: 'Medium', active: 'bg-amber-500 text-white',  inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  { value: 'high',   label: 'High',   active: 'bg-red-600 text-white',    inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
]

const STATUSES = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
]

async function loadLinkedOptions(category) {
  if (!category || category === 'general') return []

  if (category === 'placement') {
    const { data } = await supabase
      .from('placements')
      .select('id, claim_number, policyholder:policyholder_id(name)')
      .order('created_at', { ascending: false })
      .limit(150)
    return (data || []).map(p => ({
      id: p.id,
      label: `${p.claim_number} — ${p.policyholder?.name || 'Unknown'}`,
    }))
  }

  if (category === 'contact') {
    const { data } = await supabase
      .from('contacts')
      .select('id, name, company_name')
      .order('name')
      .limit(150)
    return (data || []).map(c => ({
      id: c.id,
      label: c.name && c.company_name
        ? `${c.name} (${c.company_name})`
        : c.name || c.company_name || '—',
    }))
  }

  if (category === 'inventory') {
    const { data } = await supabase
      .from('units')
      .select('id, unit_id, property_name')
      .order('property_name')
      .limit(150)
    return (data || []).map(u => ({
      id: u.id,
      label: `${u.unit_id} — ${u.property_name}`,
    }))
  }

  if (category === 'billing') {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, placement:placement_id(claim_number)')
      .order('created_at', { ascending: false })
      .limit(150)
    return (data || []).map(inv => ({
      id: inv.id,
      label: `${inv.invoice_number || inv.id.slice(0, 8)} — ${inv.placement?.claim_number || ''}`,
    }))
  }

  return []
}

export default function TaskFormPanel({ task = null, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = !!task

  const [form, setForm] = useState(() => task
    ? {
        title:       task.title       || '',
        description: task.description || '',
        status:      task.status      || 'todo',
        priority:    task.priority    || 'medium',
        category:    task.category    || 'general',
        linked_id:   task.linked_id   || '',
        linked_label:task.linked_label|| '',
        assigned_to: task.assignee?.id || '',
        due_date:    task.due_date    || '',
      }
    : { title: '', description: '', status: 'todo', priority: 'medium', category: 'general', linked_id: '', linked_label: '', assigned_to: '', due_date: '' }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [linkedOptions, setLinkedOptions] = useState([])
  const [loadingLinked, setLoadingLinked] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name')
      .then(({ data }) => setTeamMembers(data || []))
  }, [])

  useEffect(() => {
    if (!form.category || form.category === 'general') {
      setLinkedOptions([])
      return
    }
    setLoadingLinked(true)
    loadLinkedOptions(form.category).then(opts => {
      setLinkedOptions(opts)
      setLoadingLinked(false)
    })
  }, [form.category])

  async function handleSubmit() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError(null)

    const payload = {
      title:        form.title.trim(),
      description:  form.description || null,
      status:       form.status,
      priority:     form.priority,
      category:     form.category,
      linked_id:    form.linked_id   || null,
      linked_label: form.linked_label || null,
      assigned_to:  form.assigned_to || null,
      due_date:     form.due_date    || null,
    }

    try {
      let saved
      if (isEdit) {
        const { data, error: err } = await supabase
          .from('tasks')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', task.id)
          .select(`
            id, title, description, status, priority, category,
            linked_id, linked_label, due_date, completed_at, created_at, updated_at,
            assignee:assigned_to (id, full_name),
            creator:created_by (id, full_name)
          `)
          .single()
        if (err) throw new Error(err.message)
        saved = data
      } else {
        const { data, error: err } = await supabase
          .from('tasks')
          .insert({ ...payload, created_by: user.id })
          .select(`
            id, title, description, status, priority, category,
            linked_id, linked_label, due_date, completed_at, created_at, updated_at,
            assignee:assigned_to (id, full_name),
            creator:created_by (id, full_name)
          `)
          .single()
        if (err) throw new Error(err.message)
        saved = data
      }
      onSaved(saved)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const categoryLabel = CATEGORIES.find(c => c.value === form.category)?.label

  const footer = (
    <button
      onClick={handleSubmit}
      disabled={saving}
      className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors"
    >
      {saving ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Task')}
    </button>
  )

  return (
    <SlidePanel
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'New Task'}
      footer={footer}
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <Field
        label="Task Title *"
        value={form.title}
        onChange={v => set('title', v)}
        placeholder="What needs to be done?"
      />

      <TextArea
        label="Description"
        value={form.description}
        onChange={v => set('description', v)}
      />

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Status</label>
          <div className="flex flex-col gap-1">
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => set('status', s.value)}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  form.status === s.value
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Priority</label>
          <div className="flex flex-col gap-1">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                onClick={() => set('priority', p.value)}
                className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  form.priority === p.value ? p.active : p.inactive
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => {
                set('category', c.value)
                set('linked_id', '')
                set('linked_label', '')
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                form.category === c.value
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Linked record */}
      {form.category && form.category !== 'general' && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Link to {categoryLabel} (optional)
          </label>
          <select
            value={form.linked_id}
            onChange={e => {
              const opt = linkedOptions.find(o => o.id === e.target.value)
              set('linked_id', e.target.value)
              set('linked_label', opt?.label || '')
            }}
            disabled={loadingLinked}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30 disabled:opacity-60"
          >
            <option value="">— None —</option>
            {linkedOptions.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Assign to */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Assign To</label>
        <select
          value={form.assigned_to}
          onChange={e => set('assigned_to', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30"
        >
          <option value="">— Unassigned —</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>{m.full_name}</option>
          ))}
        </select>
      </div>

      {/* Due date */}
      <Field
        label="Due Date"
        value={form.due_date}
        onChange={v => set('due_date', v)}
        type="date"
      />
    </SlidePanel>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
      />
    </div>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30"
      />
    </div>
  )
}
