import { useState, useEffect } from 'react'
import { Link2, X, Plus } from 'lucide-react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const EMPTY_NEW_ADJUSTER = { name: '', phone: '', email: '', carrier: '' }

export default function EditPlacementPanel({ placement, onClose, onSaved }) {
  const [form, setForm] = useState({
    claim_number: placement.claim_number || '',
    carrier_name: placement.carrier_name || '',
    adjuster_id: placement.adjuster_id || '',
    unit_id: placement.unit_id || '',
    ale_daily_limit: placement.ale_daily_limit ?? '',
    ale_total_cap: placement.ale_total_cap ?? '',
    ale_expiry_date: placement.ale_expiry_date || '',
    move_in_date: placement.move_in_date || '',
    move_out_date: placement.move_out_date || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [adjusters, setAdjusters] = useState([])
  const [units, setUnits] = useState([])
  const [adjusterSearch, setAdjusterSearch] = useState('')
  const [selectedAdjuster, setSelectedAdjuster] = useState(placement.adjuster || null)
  const [addingAdjuster, setAddingAdjuster] = useState(false)
  const [newAdjuster, setNewAdjuster] = useState(EMPTY_NEW_ADJUSTER)
  const [creatingAdjuster, setCreatingAdjuster] = useState(false)
  const [adjusterError, setAdjusterError] = useState(null)

  useEffect(() => {
    supabase.from('contacts').select('id, name, carrier, phone, email').eq('type', 'adjuster').order('name')
      .then(({ data }) => setAdjusters(data || []))

    const unitFilter = placement.unit_id
      ? `status.eq.available,id.eq.${placement.unit_id}`
      : 'status.eq.available'
    supabase.from('units').select('id, unit_id, property_name, city, status')
      .or(unitFilter).order('city')
      .then(({ data }) => setUnits(data || []))
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const filteredAdjusters = adjusterSearch.trim()
    ? adjusters.filter(a =>
        (a.name || '').toLowerCase().includes(adjusterSearch.toLowerCase()) ||
        (a.carrier || '').toLowerCase().includes(adjusterSearch.toLowerCase())
      )
    : adjusters

  function handleAdjusterSelect(adj) {
    setSelectedAdjuster(adj)
    set('adjuster_id', adj.id)
    setAdjusterSearch('')
  }

  function unlinkAdjuster() {
    setSelectedAdjuster(null)
    set('adjuster_id', '')
  }

  async function handleCreateAdjuster() {
    if (!newAdjuster.name) { setAdjusterError('Adjuster name is required.'); return }
    setCreatingAdjuster(true)
    setAdjusterError(null)
    const { data, error: err } = await supabase.from('contacts').insert({
      type: 'adjuster',
      name: newAdjuster.name,
      phone: newAdjuster.phone || null,
      email: newAdjuster.email || null,
      carrier: newAdjuster.carrier || null,
    }).select().single()
    setCreatingAdjuster(false)
    if (err) { setAdjusterError(err.message); return }
    setAdjusters(as => [...as, data])
    handleAdjusterSelect(data)
    setAddingAdjuster(false)
    setNewAdjuster(EMPTY_NEW_ADJUSTER)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('placements').update({
      claim_number: form.claim_number || null,
      carrier_name: form.carrier_name || null,
      adjuster_id: form.adjuster_id || null,
      unit_id: form.unit_id || null,
      ale_daily_limit: form.ale_daily_limit !== '' ? Number(form.ale_daily_limit) : null,
      ale_total_cap: form.ale_total_cap !== '' ? Number(form.ale_total_cap) : null,
      ale_expiry_date: form.ale_expiry_date || null,
      move_in_date: form.move_in_date || null,
      move_out_date: form.move_out_date || null,
    }).eq('id', placement.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    await supabase.from('activity_log').insert({
      entity_type: 'placement', entity_id: placement.id,
      action: 'updated', description: 'Placement details updated',
    })
    onSaved()
  }

  const footer = (
    <button onClick={handleSave} disabled={saving}
      className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
  )

  return (
    <SlidePanel onClose={onClose} title="Edit Placement" footer={footer}>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <SectionLabel>Claim Info</SectionLabel>
      <Field label="Claim Number" value={form.claim_number} onChange={v => set('claim_number', v)} />
      <Field label="Carrier Name" value={form.carrier_name} onChange={v => set('carrier_name', v)} />

      <SectionLabel>Adjuster</SectionLabel>
      {selectedAdjuster ? (
        <div className="rounded-lg border border-navy/20 bg-navy/5 p-3 space-y-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-navy shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-gray-900">{selectedAdjuster.name}</p>
            </div>
            <button onClick={unlinkAdjuster}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
          {selectedAdjuster.carrier && <p className="text-xs text-gray-500 pl-5">{selectedAdjuster.carrier}</p>}
          <p className="text-xs text-navy pl-5">Linked to Contacts</p>
        </div>
      ) : (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Search existing adjusters</label>
            <input
              type="text"
              value={adjusterSearch}
              onChange={e => setAdjusterSearch(e.target.value)}
              placeholder="Name or carrier..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
            />
            {adjusterSearch && filteredAdjusters.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {filteredAdjusters.slice(0, 6).map(a => (
                  <button key={a.id} onClick={() => handleAdjusterSelect(a)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                    <p className="font-medium text-gray-900">{a.name}</p>
                    {a.carrier && <p className="text-xs text-gray-400">{a.carrier}</p>}
                  </button>
                ))}
              </div>
            )}
            {adjusterSearch && filteredAdjusters.length === 0 && (
              <p className="text-xs text-gray-400 mt-1.5 px-1">No adjusters found.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {!addingAdjuster ? (
            <button onClick={() => setAddingAdjuster(true)}
              className="flex items-center gap-2 text-sm text-navy font-medium hover:text-navy-700 transition-colors">
              <Plus size={15} /> Add new adjuster to contacts
            </button>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Adjuster</p>
              {adjusterError && <p className="text-xs text-red-600">{adjusterError}</p>}
              <Field label="Name *" value={newAdjuster.name}
                onChange={v => setNewAdjuster(a => ({ ...a, name: v }))} />
              <Field label="Carrier" value={newAdjuster.carrier} placeholder="e.g. State Farm"
                onChange={v => setNewAdjuster(a => ({ ...a, carrier: v }))} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Phone" value={newAdjuster.phone} type="tel"
                  onChange={v => setNewAdjuster(a => ({ ...a, phone: v }))} />
                <Field label="Email" value={newAdjuster.email} type="email"
                  onChange={v => setNewAdjuster(a => ({ ...a, email: v }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateAdjuster} disabled={creatingAdjuster}
                  className="flex-1 py-2 rounded-lg bg-navy text-white text-xs font-semibold disabled:opacity-60 hover:bg-navy-700 transition-colors">
                  {creatingAdjuster ? 'Creating...' : 'Create & Link'}
                </button>
                <button onClick={() => { setAddingAdjuster(false); setNewAdjuster(EMPTY_NEW_ADJUSTER); setAdjusterError(null) }}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-white transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <SectionLabel>Housing Unit</SectionLabel>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Assigned Unit</label>
        <select value={form.unit_id} onChange={e => set('unit_id', e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
          <option value="">— Unassigned —</option>
          {units.map(u => (
            <option key={u.id} value={u.id}>
              {u.unit_id} — {u.property_name}, {u.city}{u.status !== 'available' ? ` (${u.status})` : ''}
            </option>
          ))}
        </select>
      </div>

      <SectionLabel>ALE Limits</SectionLabel>
      <Field label="Daily ALE Limit ($)" value={form.ale_daily_limit} onChange={v => set('ale_daily_limit', v)} type="number" />
      <Field label="Total ALE Cap ($)" value={form.ale_total_cap} onChange={v => set('ale_total_cap', v)} type="number" />
      <Field label="ALE Expiry Date" value={form.ale_expiry_date} onChange={v => set('ale_expiry_date', v)} type="date" />

      <SectionLabel>Dates</SectionLabel>
      <Field label="Move-in Date" value={form.move_in_date} onChange={v => set('move_in_date', v)} type="date" />
      <Field label="Expected Move-out Date" value={form.move_out_date} onChange={v => set('move_out_date', v)} type="date" />
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
