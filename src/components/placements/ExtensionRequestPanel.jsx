import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const REASONS = [
  'Home repairs delayed',
  'Additional damage discovered',
  'Contractor scheduling issues',
  'Adjuster approved extended stay',
  'Family request — special circumstances',
  'Rebuild — not a repair',
  'Other',
]

function fmt(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}

export default function ExtensionRequestPanel({ placement, onClose, onSaved }) {
  const [form, setForm] = useState({
    new_expiry_date: placement.ale_expiry_date || '',
    new_total_cap: placement.ale_total_cap ?? '',
    new_daily_limit: placement.ale_daily_limit ?? '',
    reason: '',
    adjuster_notified: false,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.new_expiry_date) { setError('New expiry date is required.'); return }
    if (!form.reason) { setError('Please select a reason for the extension.'); return }
    setSaving(true)
    setError(null)

    const updates = { ale_expiry_date: form.new_expiry_date }
    if (form.new_total_cap !== '') updates.ale_total_cap = Number(form.new_total_cap)
    if (form.new_daily_limit !== '') updates.ale_daily_limit = Number(form.new_daily_limit)

    const { error: plErr } = await supabase.from('placements').update(updates).eq('id', placement.id)
    if (plErr) { setError(plErr.message); setSaving(false); return }

    const description = [
      `ALE extended to ${fmt(form.new_expiry_date)} — ${form.reason}`,
      form.adjuster_notified ? 'Adjuster notified.' : 'Adjuster not yet notified.',
      form.notes || null,
    ].filter(Boolean).join(' · ')

    await supabase.from('activity_log').insert({
      entity_type: 'placement', entity_id: placement.id,
      action: 'ale_extended', description,
    })

    setSaving(false)
    onSaved()
  }

  const footer = (
    <button onClick={handleSave} disabled={saving}
      className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
      {saving ? 'Saving...' : 'Apply Extension'}
    </button>
  )

  return (
    <SlidePanel onClose={onClose} title="ALE Extension" subtitle={`Claim #${placement.claim_number}`} footer={footer}>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Current ALE summary */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current ALE</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400">Daily Limit</p>
            <p className="text-sm font-semibold text-gray-700">
              {placement.ale_daily_limit ? `$${Number(placement.ale_daily_limit).toLocaleString()}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Cap</p>
            <p className="text-sm font-semibold text-gray-700">
              {placement.ale_total_cap ? `$${Number(placement.ale_total_cap).toLocaleString()}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Expiry</p>
            <p className="text-sm font-semibold text-gray-700">{fmt(placement.ale_expiry_date)}</p>
          </div>
        </div>
      </div>

      <SectionLabel>New ALE Terms</SectionLabel>
      <Field label="New Expiry Date *" value={form.new_expiry_date} onChange={v => set('new_expiry_date', v)} type="date" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="New Daily Limit ($)" value={form.new_daily_limit} onChange={v => set('new_daily_limit', v)} type="number" placeholder="Leave blank to keep" />
        <Field label="New Total Cap ($)" value={form.new_total_cap} onChange={v => set('new_total_cap', v)} type="number" placeholder="Leave blank to keep" />
      </div>

      <SectionLabel>Extension Details</SectionLabel>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Reason *</label>
        <select value={form.reason} onChange={e => set('reason', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
          <option value="">— Select reason —</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.adjuster_notified}
          onChange={e => set('adjuster_notified', e.target.checked)}
          className="rounded border-gray-300 text-navy" />
        <span className="text-sm text-gray-700">Adjuster has been notified of extension</span>
      </label>

      <TextArea label="Notes" value={form.notes} onChange={v => set('notes', v)} placeholder="Authorization reference, adjuster notes..." />
    </SlidePanel>
  )
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</p>
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white" />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
    </div>
  )
}
