import { useState, useEffect } from 'react'
import { Link2, X, Plus, Phone, Mail } from 'lucide-react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const US_STATES = [
  {code:'AL',name:'Alabama'},{code:'AK',name:'Alaska'},{code:'AZ',name:'Arizona'},
  {code:'AR',name:'Arkansas'},{code:'CA',name:'California'},{code:'CO',name:'Colorado'},
  {code:'CT',name:'Connecticut'},{code:'DE',name:'Delaware'},{code:'FL',name:'Florida'},
  {code:'GA',name:'Georgia'},{code:'HI',name:'Hawaii'},{code:'ID',name:'Idaho'},
  {code:'IL',name:'Illinois'},{code:'IN',name:'Indiana'},{code:'IA',name:'Iowa'},
  {code:'KS',name:'Kansas'},{code:'KY',name:'Kentucky'},{code:'LA',name:'Louisiana'},
  {code:'ME',name:'Maine'},{code:'MD',name:'Maryland'},{code:'MA',name:'Massachusetts'},
  {code:'MI',name:'Michigan'},{code:'MN',name:'Minnesota'},{code:'MS',name:'Mississippi'},
  {code:'MO',name:'Missouri'},{code:'MT',name:'Montana'},{code:'NE',name:'Nebraska'},
  {code:'NV',name:'Nevada'},{code:'NH',name:'New Hampshire'},{code:'NJ',name:'New Jersey'},
  {code:'NM',name:'New Mexico'},{code:'NY',name:'New York'},{code:'NC',name:'North Carolina'},
  {code:'ND',name:'North Dakota'},{code:'OH',name:'Ohio'},{code:'OK',name:'Oklahoma'},
  {code:'OR',name:'Oregon'},{code:'PA',name:'Pennsylvania'},{code:'RI',name:'Rhode Island'},
  {code:'SC',name:'South Carolina'},{code:'SD',name:'South Dakota'},{code:'TN',name:'Tennessee'},
  {code:'TX',name:'Texas'},{code:'UT',name:'Utah'},{code:'VT',name:'Vermont'},
  {code:'VA',name:'Virginia'},{code:'WA',name:'Washington'},{code:'WV',name:'West Virginia'},
  {code:'WI',name:'Wisconsin'},{code:'WY',name:'Wyoming'},{code:'DC',name:'Washington D.C.'},
  {code:'PR',name:'Puerto Rico'},{code:'GU',name:'Guam'},{code:'VI',name:'U.S. Virgin Islands'},
  {code:'AS',name:'American Samoa'},{code:'MP',name:'N. Mariana Islands'},
]

const PROPERTY_TYPES = [
  'Single Family Home','Apartment','Condo','Townhouse',
  'Duplex','Mobile Home','Extended Stay Hotel','Other',
]

const EMPTY = {
  unit_id: '', property_name: '', address: '', city: '', state: '', zip: '',
  property_type: '', bedrooms: '', bathrooms: '', max_occupants: '', sq_ft: '',
  monthly_rate: '', daily_rate: '',
  ale_eligible: true, pet_friendly: false, accessibility: false,
  tier: '', status: 'available',
  vendor_id: '', vendor_name: '', vendor_phone: '', vendor_email: '',
  property_link: '', dropbox_link: '', amenities: '', notes: '',
}

const EMPTY_NEW_VENDOR = { name: '', company_name: '', phone: '', email: '' }

export default function NewUnitModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)
  const [generatingId, setGeneratingId] = useState(false)

  // Vendor contact linking
  const [vendors, setVendors] = useState([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [addingVendor, setAddingVendor] = useState(false)
  const [newVendor, setNewVendor] = useState(EMPTY_NEW_VENDOR)
  const [creatingVendor, setCreatingVendor] = useState(false)
  const [vendorError, setVendorError] = useState(null)

  useEffect(() => {
    supabase.from('contacts').select('id, name, company_name, phone, email')
      .eq('type', 'vendor').order('name')
      .then(({ data }) => setVendors(data || []))
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleStateChange(stateCode) {
    set('state', stateCode)
    if (!stateCode) return
    setGeneratingId(true)
    const { count } = await supabase
      .from('units').select('*', { count: 'exact', head: true }).eq('state', stateCode)
    set('unit_id', `${stateCode}-${String((count || 0) + 1).padStart(3, '0')}`)
    setGeneratingId(false)
  }

  function handleVendorSelect(vendorId) {
    if (!vendorId) {
      setSelectedVendor(null)
      setForm(f => ({ ...f, vendor_id: '', vendor_name: '', vendor_phone: '', vendor_email: '' }))
      return
    }
    const v = vendors.find(v => v.id === vendorId)
    if (!v) return
    setSelectedVendor(v)
    setForm(f => ({
      ...f,
      vendor_id: v.id,
      vendor_name: v.name || v.company_name || '',
      vendor_phone: v.phone || '',
      vendor_email: v.email || '',
    }))
    setVendorSearch('')
  }

  function unlinkVendor() {
    setSelectedVendor(null)
    setForm(f => ({ ...f, vendor_id: '', vendor_name: '', vendor_phone: '', vendor_email: '' }))
  }

  async function handleCreateVendor() {
    if (!newVendor.name && !newVendor.company_name) {
      setVendorError('A name or company name is required.')
      return
    }
    setCreatingVendor(true)
    setVendorError(null)
    const { data, error: err } = await supabase.from('contacts').insert({
      type: 'vendor',
      name: newVendor.name || newVendor.company_name,
      company_name: newVendor.company_name || null,
      phone: newVendor.phone || null,
      email: newVendor.email || null,
    }).select().single()

    setCreatingVendor(false)
    if (err) { setVendorError(err.message); return }

    // Add to local list and auto-select
    setVendors(vs => [...vs, data])
    handleVendorSelect(data.id)
    setAddingVendor(false)
    setNewVendor(EMPTY_NEW_VENDOR)
  }

  const filteredVendors = vendorSearch.trim()
    ? vendors.filter(v =>
        (v.name || '').toLowerCase().includes(vendorSearch.toLowerCase()) ||
        (v.company_name || '').toLowerCase().includes(vendorSearch.toLowerCase())
      )
    : vendors

  async function handleSubmit() {
    if (!form.unit_id || !form.property_name || !form.address || !form.city || !form.state || !form.zip) {
      setError('Unit ID, property name, and full address are required.')
      return
    }
    if (!form.bedrooms || !form.bathrooms) {
      setError('Bedrooms and bathrooms are required.')
      return
    }
    setSaving(true)
    setError(null)

    const amenitiesArr = form.amenities
      ? form.amenities.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const { data, error: err } = await supabase.from('units').insert({
      unit_id: form.unit_id,
      property_name: form.property_name,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      property_type: form.property_type || null,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      max_occupants: form.max_occupants ? Number(form.max_occupants) : null,
      sq_ft: form.sq_ft ? Number(form.sq_ft) : null,
      monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : null,
      daily_rate: form.daily_rate ? Number(form.daily_rate) : null,
      ale_eligible: form.ale_eligible,
      pet_friendly: form.pet_friendly,
      accessibility: form.accessibility,
      tier: form.tier ? Number(form.tier) : null,
      status: form.status,
      vendor_id: form.vendor_id || null,
      vendor_name: form.vendor_name || null,
      vendor_phone: form.vendor_phone || null,
      vendor_email: form.vendor_email || null,
      property_link: form.property_link || null,
      dropbox_link: form.dropbox_link || null,
      amenities: amenitiesArr.length ? amenitiesArr : null,
      notes: form.notes || null,
      last_updated: new Date().toISOString(),
    }).select().single()

    setSaving(false)
    if (err) { setError(err.message); return }
    onCreated(data)
  }

  const STEPS = 3
  const footer = (
    <div className="flex gap-3">
      {step > 1 && (
        <button onClick={() => setStep(s => s - 1)}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">
          Back
        </button>
      )}
      {step < STEPS ? (
        <button onClick={() => setStep(s => s + 1)}
          className="flex-1 py-2.5 rounded-lg bg-navy text-white font-medium text-sm hover:bg-navy-700 transition-colors">
          Next
        </button>
      ) : (
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
          {saving ? 'Saving...' : 'Add Unit'}
        </button>
      )}
    </div>
  )

  return (
    <SlidePanel onClose={onClose} title="New Unit" subtitle={`Step ${step} of ${STEPS}`} footer={footer}>
      {/* Step progress */}
      <div className="flex gap-1.5">
        {Array(STEPS).fill(0).map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < step ? 'bg-navy' : 'bg-gray-200'}`} />
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* ── Step 1: Location & Identity ── */}
      {step === 1 && (
        <>
          <SectionLabel>Location</SectionLabel>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">State / Territory *</label>
            <select value={form.state} onChange={e => handleStateChange(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="">— Select state —</option>
              {US_STATES.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Unit ID *
              {generatingId && <span className="ml-2 text-gray-400 font-normal">generating...</span>}
              {!generatingId && form.unit_id && <span className="ml-2 text-gray-400 font-normal italic">auto-generated · editable</span>}
            </label>
            <input type="text" value={form.unit_id} onChange={e => set('unit_id', e.target.value)}
              placeholder="Select a state first"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white font-mono" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Property Type</label>
            <select value={form.property_type} onChange={e => set('property_type', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="">— Select type —</option>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <Field label="Property Name *" value={form.property_name} onChange={v => set('property_name', v)} />
          <Field label="Street Address *" value={form.address} onChange={v => set('address', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City *" value={form.city} onChange={v => set('city', v)} />
            <Field label="ZIP *" value={form.zip} onChange={v => set('zip', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Property Link" value={form.property_link} onChange={v => set('property_link', v)} placeholder="https://..." />
            <Field label="Dropbox Link" value={form.dropbox_link} onChange={v => set('dropbox_link', v)} placeholder="https://..." />
          </div>
        </>
      )}

      {/* ── Step 2: Unit Details ── */}
      {step === 2 && (
        <>
          <SectionLabel>Unit Details</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrooms *" value={form.bedrooms} onChange={v => set('bedrooms', v)} type="number" />
            <Field label="Bathrooms *" value={form.bathrooms} onChange={v => set('bathrooms', v)} type="number" placeholder="1.5" />
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
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="occupied">Occupied</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <SectionLabel>Features</SectionLabel>
          <div className="flex flex-col gap-2">
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
          </div>
        </>
      )}

      {/* ── Step 3: Vendor, Amenities, Notes ── */}
      {step === 3 && (
        <>
          <SectionLabel>Vendor / Owner</SectionLabel>

          {/* Linked vendor card */}
          {selectedVendor ? (
            <div className="rounded-lg border border-navy/20 bg-navy/5 p-3 space-y-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-navy shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedVendor.name || selectedVendor.company_name}
                  </p>
                </div>
                <button onClick={unlinkVendor}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
              {selectedVendor.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500 pl-5">
                  <Phone size={11} /> {selectedVendor.phone}
                </div>
              )}
              {selectedVendor.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500 pl-5">
                  <Mail size={11} /> {selectedVendor.email}
                </div>
              )}
              <p className="text-xs text-navy pl-5">Linked to Contacts</p>
            </div>
          ) : (
            <>
              {/* Search existing vendors */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Link existing contact</label>
                <input
                  type="text"
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  placeholder="Search vendors..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
                />
                {vendorSearch && filteredVendors.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {filteredVendors.slice(0, 6).map(v => (
                      <button key={v.id} onClick={() => handleVendorSelect(v.id)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                        <p className="font-medium text-gray-900">{v.name || v.company_name}</p>
                        {v.phone && <p className="text-xs text-gray-400">{v.phone}</p>}
                      </button>
                    ))}
                  </div>
                )}
                {vendorSearch && filteredVendors.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1.5 px-1">No vendors found.</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Quick-create new vendor */}
              {!addingVendor ? (
                <button onClick={() => setAddingVendor(true)}
                  className="flex items-center gap-2 text-sm text-navy font-medium hover:text-navy-700 transition-colors">
                  <Plus size={15} /> Add new vendor to contacts
                </button>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Vendor</p>
                  {vendorError && <p className="text-xs text-red-600">{vendorError}</p>}
                  <Field label="Name *" value={newVendor.name}
                    onChange={v => setNewVendor(nv => ({ ...nv, name: v }))} />
                  <Field label="Company Name" value={newVendor.company_name}
                    onChange={v => setNewVendor(nv => ({ ...nv, company_name: v }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Phone" value={newVendor.phone} type="tel"
                      onChange={v => setNewVendor(nv => ({ ...nv, phone: v }))} />
                    <Field label="Email" value={newVendor.email} type="email"
                      onChange={v => setNewVendor(nv => ({ ...nv, email: v }))} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCreateVendor} disabled={creatingVendor}
                      className="flex-1 py-2 rounded-lg bg-navy text-white text-xs font-semibold disabled:opacity-60 hover:bg-navy-700 transition-colors">
                      {creatingVendor ? 'Creating...' : 'Create & Link'}
                    </button>
                    <button onClick={() => { setAddingVendor(false); setNewVendor(EMPTY_NEW_VENDOR); setVendorError(null) }}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-white transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Manual fallback if no contact selected */}
              {!addingVendor && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">or enter manually</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <Field label="Vendor / Owner Name" value={form.vendor_name} onChange={v => set('vendor_name', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Phone" value={form.vendor_phone} onChange={v => set('vendor_phone', v)} type="tel" />
                    <Field label="Email" value={form.vendor_email} onChange={v => set('vendor_email', v)} type="email" />
                  </div>
                </>
              )}
            </>
          )}

          <SectionLabel>Amenities</SectionLabel>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Amenities (comma-separated)</label>
            <textarea value={form.amenities} onChange={e => set('amenities', e.target.value)}
              placeholder="Washer/Dryer, Garage, Pool, WiFi..." rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>

          <SectionLabel>Notes</SectionLabel>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Internal Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Access instructions, restrictions, context..." rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
        </>
      )}
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
