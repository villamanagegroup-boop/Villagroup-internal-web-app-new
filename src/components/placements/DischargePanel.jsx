import { useState } from 'react'
import { format } from 'date-fns'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const REASONS = [
  'Claim resolved — home repaired',
  'Claim resolved — family returned to home',
  'Family relocated permanently',
  'Claim cancelled',
  'Family left voluntarily',
  'ALE coverage exhausted',
  'Other',
]

export default function DischargePanel({ placement, onClose, onSaved }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    move_out_date: today,
    reason: '',
    condition_notes: '',
    final_invoice_created: false,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.reason) { setError('Please select a discharge reason.'); return }
    setSaving(true)
    setError(null)

    const { error: plErr } = await supabase
      .from('placements')
      .update({
        status: 'discharged',
        move_out_date: form.move_out_date || today,
      })
      .eq('id', placement.id)

    if (plErr) { setError(plErr.message); setSaving(false); return }

    // Free the unit
    if (placement.unit_id) {
      await supabase.from('units').update({ status: 'available' }).eq('id', placement.unit_id)
    }

    const description = [
      `Placement discharged — ${form.reason}`,
      form.condition_notes ? `Condition: ${form.condition_notes}` : null,
      form.final_invoice_created ? 'Final invoice created.' : null,
      form.notes || null,
    ].filter(Boolean).join(' · ')

    await supabase.from('activity_log').insert({
      entity_type: 'placement', entity_id: placement.id,
      action: 'discharged', description,
    })

    setSaving(false)
    onSaved()
  }

  const footer = (
    <button onClick={handleSave} disabled={saving}
      className="w-full py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm disabled:opacity-60 hover:bg-red-700 transition-colors">
      {saving ? 'Discharging...' : 'Confirm Discharge'}
    </button>
  )

  return (
    <SlidePanel onClose={onClose} title="Discharge Placement" subtitle={placement.claim_number} footer={footer}>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
        <p className="text-xs text-amber-800 font-medium">This will mark the placement as discharged and release the unit back to available inventory.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <SectionLabel>Move-out Details</SectionLabel>
      <Field label="Move-out Date" value={form.move_out_date} onChange={v => set('move_out_date', v)} type="date" />

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Reason for Discharge *</label>
        <select value={form.reason} onChange={e => set('reason', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
          <option value="">— Select reason —</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <SectionLabel>Unit Condition</SectionLabel>
      <TextArea
        label="Condition Notes at Move-out"
        value={form.condition_notes}
        onChange={v => set('condition_notes', v)}
        placeholder="General condition of the unit on departure..."
        rows={3}
      />

      <SectionLabel>Billing</SectionLabel>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.final_invoice_created}
          onChange={e => set('final_invoice_created', e.target.checked)}
          className="rounded border-gray-300 text-navy" />
        <span className="text-sm text-gray-700">Final invoice has been created</span>
      </label>

      <TextArea label="Additional Notes" value={form.notes} onChange={v => set('notes', v)} placeholder="Anything else to note..." />
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

function TextArea({ label, value, onChange, placeholder, rows = 2 }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
    </div>
  )
}
