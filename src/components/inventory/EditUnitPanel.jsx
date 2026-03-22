import { useState } from 'react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const PROPERTY_TYPES = [
  'Single Family Home', 'Apartment', 'Condo', 'Townhouse',
  'Duplex', 'Mobile Home', 'Extended Stay Hotel', 'Other',
]

export default function EditUnitPanel({ unit, onClose, onSaved }) {
  const [form, setForm] = useState({
    property_name: unit.property_name || '',
    address: unit.address || '',
    city: unit.city || '',
    zip: unit.zip || '',
    property_type: unit.property_type || '',
    bedrooms: unit.bedrooms ?? '',
    bathrooms: unit.bathrooms ?? '',
    max_occupants: unit.max_occupants ?? '',
    sq_ft: unit.sq_ft ?? '',
    monthly_rate: unit.monthly_rate ?? '',
    daily_rate: unit.daily_rate ?? '',
    tier: unit.tier ?? '',
    ale_eligible: unit.ale_eligible ?? true,
    pet_friendly: unit.pet_friendly ?? false,
    accessibility: unit.accessibility ?? false,
    amenities: Array.isArray(unit.amenities) ? unit.amenities.join(', ') : (unit.amenities || ''),
    property_link: unit.property_link || '',
    dropbox_link: unit.dropbox_link || '',
    notes: unit.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.property_name) { setError('Property name is required.'); return }
    setSaving(true)
    setError(null)

    const amenitiesArr = form.amenities
      ? form.amenities.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const { error: err } = await supabase.from('units').update({
      property_name: form.property_name,
      address: form.address || null,
      city: form.city || null,
      zip: form.zip || null,
      property_type: form.property_type || null,
      bedrooms: form.bedrooms !== '' ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms !== '' ? Number(form.bathrooms) : null,
      max_occupants: form.max_occupants !== '' ? Number(form.max_occupants) : null,
      sq_ft: form.sq_ft !== '' ? Number(form.sq_ft) : null,
      monthly_rate: form.monthly_rate !== '' ? Number(form.monthly_rate) : null,
      daily_rate: form.daily_rate !== '' ? Number(form.daily_rate) : null,
      tier: form.tier !== '' ? Number(form.tier) : null,
      ale_eligible: form.ale_eligible,
      pet_friendly: form.pet_friendly,
      accessibility: form.accessibility,
      amenities: amenitiesArr.length ? amenitiesArr : null,
      property_link: form.property_link || null,
      dropbox_link: form.dropbox_link || null,
      notes: form.notes || null,
      last_updated: new Date().toISOString(),
    }).eq('id', unit.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  const footer = (
    <button onClick={handleSave} disabled={saving}
      className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
  )

  return (
    <SlidePanel onClose={onClose} title="Edit Unit" subtitle={unit.unit_id} footer={footer}>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <SectionLabel>Property</SectionLabel>
      <Field label="Property Name *" value={form.property_name} onChange={v => set('property_name', v)} />
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Property Type</label>
        <select value={form.property_type} onChange={e => set('property_type', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
          <option value="">— Select type —</option>
          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <Field label="Street Address" value={form.address} onChange={v => set('address', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" value={form.city} onChange={v => set('city', v)} />
        <Field label="ZIP" value={form.zip} onChange={v => set('zip', v)} />
      </div>

      <SectionLabel>Unit Details</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bedrooms" value={form.bedrooms} onChange={v => set('bedrooms', v)} type="number" />
        <Field label="Bathrooms" value={form.bathrooms} onChange={v => set('bathrooms', v)} type="number" placeholder="1.5" />
        <Field label="Max Occupants" value={form.max_occupants} onChange={v => set('max_occupants', v)} type="number" />
        <Field label="Sq Ft" value={form.sq_ft} onChange={v => set('sq_ft', v)} type="number" />
        <Field label="Monthly Rate ($)" value={form.monthly_rate} onChange={v => set('monthly_rate', v)} type="number" />
        <Field label="Daily Rate ($)" value={form.daily_rate} onChange={v => set('daily_rate', v)} type="number" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Tier</label>
        <select value={form.tier} onChange={e => set('tier', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
          <option value="">— No tier —</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
      </div>

      <SectionLabel>Features</SectionLabel>
      {[
        ['ale_eligible', 'ALE Eligible'],
        ['pet_friendly', 'Pet Friendly'],
        ['accessibility', 'ADA / Accessibility Features'],
      ].map(([field, label]) => (
        <label key={field} className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form[field]} onChange={e => set(field, e.target.checked)}
            className="rounded border-gray-300 text-navy" />
          <span className="text-sm text-gray-700">{label}</span>
        </label>
      ))}

      <SectionLabel>Links & Amenities</SectionLabel>
      <Field label="Property Link" value={form.property_link} onChange={v => set('property_link', v)} placeholder="https://..." />
      <Field label="Dropbox Link" value={form.dropbox_link} onChange={v => set('dropbox_link', v)} placeholder="https://..." />
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Amenities (comma-separated)</label>
        <textarea value={form.amenities} onChange={e => set('amenities', e.target.value)}
          placeholder="Washer/Dryer, Garage, Pool, WiFi..." rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
      </div>

      <SectionLabel>Notes</SectionLabel>
      <div>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Access instructions, restrictions, context..." rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
      </div>
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
