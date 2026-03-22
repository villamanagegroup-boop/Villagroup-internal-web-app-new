import { useState } from 'react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor']

const ROOMS = [
  { key: 'kitchen_notes',      label: 'Kitchen' },
  { key: 'living_room_notes',  label: 'Living Room' },
  { key: 'bathroom_notes',     label: 'Bathroom(s)' },
  { key: 'bedroom_notes',      label: 'Bedroom(s)' },
  { key: 'exterior_notes',     label: 'Exterior / Entry' },
]

export default function ConditionReportPanel({ placement, reportType = 'move_in', onClose, onSaved }) {
  const [form, setForm] = useState({
    report_type: reportType,
    overall_condition: '',
    kitchen_notes: '',
    living_room_notes: '',
    bathroom_notes: '',
    bedroom_notes: '',
    exterior_notes: '',
    damage_notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.overall_condition) { setError('Overall condition rating is required.'); return }
    setSaving(true)
    setError(null)

    const { error: err } = await supabase.from('condition_reports').insert({
      placement_id: placement.id,
      unit_id: placement.unit_id || null,
      report_type: form.report_type,
      overall_condition: form.overall_condition,
      kitchen_notes: form.kitchen_notes || null,
      living_room_notes: form.living_room_notes || null,
      bathroom_notes: form.bathroom_notes || null,
      bedroom_notes: form.bedroom_notes || null,
      exterior_notes: form.exterior_notes || null,
      damage_notes: form.damage_notes || null,
    })

    if (err) { setError(err.message); setSaving(false); return }

    await supabase.from('activity_log').insert({
      entity_type: 'placement', entity_id: placement.id,
      action: 'condition_report',
      description: `${form.report_type === 'move_in' ? 'Move-in' : 'Move-out'} condition report filed — ${form.overall_condition}`,
    })

    setSaving(false)
    onSaved()
  }

  const footer = (
    <button onClick={handleSave} disabled={saving}
      className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
      {saving ? 'Saving...' : 'Save Condition Report'}
    </button>
  )

  const isMovein = form.report_type === 'move_in'

  return (
    <SlidePanel
      onClose={onClose}
      title="Condition Report"
      subtitle={`Claim #${placement.claim_number}`}
      footer={footer}
    >
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Report type toggle */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-2">Report Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[['move_in', 'Move-in'], ['move_out', 'Move-out']].map(([val, label]) => (
            <button key={val} onClick={() => set('report_type', val)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                form.report_type === val ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <SectionLabel>Overall Condition</SectionLabel>
      <div className="grid grid-cols-4 gap-1.5">
        {CONDITION_OPTIONS.map(opt => {
          const colors = {
            Excellent: 'bg-green-500 text-white',
            Good: 'bg-blue-500 text-white',
            Fair: 'bg-amber-500 text-white',
            Poor: 'bg-red-500 text-white',
          }
          return (
            <button key={opt} onClick={() => set('overall_condition', opt)}
              className={`py-2 rounded-lg text-sm font-medium transition-all border ${
                form.overall_condition === opt
                  ? `${colors[opt]} border-transparent`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}>
              {opt}
            </button>
          )
        })}
      </div>

      <SectionLabel>Room Notes <span className="normal-case font-normal text-gray-400">(optional)</span></SectionLabel>
      {ROOMS.map(({ key, label }) => (
        <TextArea key={key} label={label} value={form[key]} onChange={v => set(key, v)}
          placeholder={`Notes for ${label.toLowerCase()}...`} />
      ))}

      <SectionLabel>Damage & Issues</SectionLabel>
      <TextArea
        label="Damage Notes"
        value={form.damage_notes}
        onChange={v => set('damage_notes', v)}
        placeholder={isMovein
          ? 'Note any pre-existing damage before family moves in...'
          : 'Note any damage caused during placement, items missing, cleaning required...'}
        rows={3}
      />
    </SlidePanel>
  )
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</p>
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
