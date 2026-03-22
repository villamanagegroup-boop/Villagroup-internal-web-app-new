import { useState, useEffect } from 'react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const URGENCY_OPTIONS = [
  { value: 'low',       label: 'Low',       color: 'bg-gray-100 text-gray-600' },
  { value: 'medium',    label: 'Medium',    color: 'bg-blue-100 text-blue-700' },
  { value: 'high',      label: 'High',      color: 'bg-amber-100 text-amber-700' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-700' },
]

export default function MaintenanceRequestPanel({ unit, placement, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: '',
    urgency: 'medium',
    assigned_vendor_id: '',
    notes: '',
  })
  const [vendors, setVendors] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('contacts').select('id, name, company_name, phone').eq('type', 'vendor').order('name')
      .then(({ data }) => setVendors(data || []))
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.description.trim()) { setError('Description is required.'); return }
    setSaving(true)
    setError(null)

    const { error: err } = await supabase.from('maintenance_requests').insert({
      unit_id: unit?.id || null,
      placement_id: placement?.id || null,
      description: form.description,
      urgency: form.urgency,
      status: 'open',
      assigned_vendor_id: form.assigned_vendor_id || null,
      notes: form.notes || null,
    })

    if (err) { setError(err.message); setSaving(false); return }

    const entityId = placement?.id || unit?.id
    const entityType = placement ? 'placement' : 'unit'
    if (entityId) {
      await supabase.from('activity_log').insert({
        entity_type: entityType, entity_id: entityId,
        action: 'maintenance_logged',
        description: `Maintenance request logged [${form.urgency}]: ${form.description.slice(0, 80)}`,
      })
    }

    setSaving(false)
    onSaved()
  }

  const footer = (
    <button onClick={handleSave} disabled={saving}
      className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
      {saving ? 'Logging...' : 'Submit Maintenance Request'}
    </button>
  )

  return (
    <SlidePanel
      onClose={onClose}
      title="Maintenance Request"
      subtitle={unit ? `${unit.property_name} · ${unit.unit_id}` : ''}
      footer={footer}
    >
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <SectionLabel>Issue Description</SectionLabel>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">What needs attention? *</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
          placeholder="Describe the issue in detail — what, where, when noticed..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30"
          autoFocus
        />
      </div>

      <SectionLabel>Urgency</SectionLabel>
      <div className="grid grid-cols-4 gap-1.5">
        {URGENCY_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => set('urgency', opt.value)}
            className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
              form.urgency === opt.value
                ? `${opt.color} border-transparent ring-2 ring-offset-1 ring-navy/30`
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      <SectionLabel>Assign Vendor <span className="normal-case font-normal text-gray-400">(optional)</span></SectionLabel>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Assigned To</label>
        <select value={form.assigned_vendor_id} onChange={e => set('assigned_vendor_id', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
          <option value="">— Unassigned —</option>
          {vendors.map(v => (
            <option key={v.id} value={v.id}>{v.company_name || v.name}{v.phone ? ` · ${v.phone}` : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Additional Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
          placeholder="Access instructions, vendor contact notes, prior attempts..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
      </div>
    </SlidePanel>
  )
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</p>
}
