import { useState, useEffect } from 'react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const PARTNER_CATEGORIES = [
  'Public Adjuster', 'Independent Adjuster', 'Claims Staff Adjuster',
  'TPA (Third-Party Administrator)', 'Former ALE Manager', 'ALE Solutions Provider',
  'Insurance Carrier (ALE Dept)', 'Corporate Relocation Company', 'Social Worker',
  'Mental Health Partner', 'School Enrollment Specialist', 'Extended Stay Hotel DOS',
  'Real Estate Investor (REIA)', 'New Construction Builder',
]
const OWNER_CATEGORIES = [
  'Private Homeowner (Furnished)', 'Furnished Apartment Company', 'Vacation Rental Manager',
]
const VENDOR_CATEGORIES = [
  'Restoration Contractor', 'Pet Boarding / Pet-Friendly Network',
  'Cleaning Service', 'Maintenance / Handyman', 'Moving Company', 'Other',
]
const RESPONSE_STATUSES = ['Contacted', 'Responded', 'No Response', 'Not Interested', 'Follow Up']

export default function EditContactPanel({ contact, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: contact.name || '',
    company_name: contact.company_name || '',
    phone: contact.phone || '',
    email: contact.email || '',
    city: contact.city || '',
    notes: contact.notes || '',
    // adjuster
    carrier: contact.carrier || '',
    tpa_id: contact.tpa_id || '',
    // tpa
    billing_contact: contact.billing_contact || '',
    // partner
    role: contact.role || '',
    contact_category: contact.contact_category || '',
    source_of_lead: contact.source_of_lead || '',
    referral_count: contact.referral_count ?? '',
    date_contacted: contact.date_contacted || '',
    // owner
    num_properties: contact.num_properties ?? '',
    active_listings: contact.active_listings ?? '',
    referral_source: contact.referral_source || '',
    // vendor
    service_type: contact.service_type || '',
    preferred_vendor: contact.preferred_vendor || false,
    commission_agreement: contact.commission_agreement || '',
    // lead
    response_status: contact.response_status || '',
    follow_up_date: contact.follow_up_date || '',
    // client
    num_adults: contact.num_adults ?? '',
    num_children: contact.num_children ?? '',
  })
  const [tpas, setTpas] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (contact.type === 'adjuster') {
      supabase.from('contacts').select('id, company_name, name').eq('type', 'tpa').order('company_name')
        .then(({ data }) => setTpas(data || []))
    }
  }, [contact.type])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name || null,
      company_name: form.company_name || null,
      phone: form.phone || null,
      email: form.email || null,
      city: form.city || null,
      notes: form.notes || null,
    }

    if (contact.type === 'adjuster') {
      payload.carrier = form.carrier || null
      payload.tpa_id = form.tpa_id || null
    }
    if (contact.type === 'tpa') {
      payload.billing_contact = form.billing_contact || null
    }
    if (contact.type === 'partner') {
      payload.role = form.role || null
      payload.contact_category = form.contact_category || null
      payload.source_of_lead = form.source_of_lead || null
      payload.referral_count = form.referral_count !== '' ? Number(form.referral_count) : null
      payload.date_contacted = form.date_contacted || null
    }
    if (contact.type === 'property_owner') {
      payload.contact_category = form.contact_category || null
      payload.num_properties = form.num_properties !== '' ? Number(form.num_properties) : null
      payload.active_listings = form.active_listings !== '' ? Number(form.active_listings) : null
      payload.referral_source = form.referral_source || null
    }
    if (contact.type === 'vendor') {
      payload.contact_category = form.contact_category || null
      payload.service_type = form.service_type || null
      payload.preferred_vendor = form.preferred_vendor || false
      payload.commission_agreement = form.commission_agreement || null
    }
    if (contact.type === 'lead') {
      payload.contact_category = form.contact_category || null
      payload.date_contacted = form.date_contacted || null
      payload.response_status = form.response_status || null
      payload.follow_up_date = form.follow_up_date || null
    }
    if (contact.type === 'policyholder') {
      payload.num_adults = form.num_adults !== '' ? Number(form.num_adults) : null
      payload.num_children = form.num_children !== '' ? Number(form.num_children) : null
    }

    const { error: err } = await supabase.from('contacts').update(payload).eq('id', contact.id)
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

  const t = contact.type

  return (
    <SlidePanel onClose={onClose} title="Edit Contact" subtitle={contact.contact_ref_id} footer={footer}>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Common fields */}
      {['tpa', 'vendor', 'partner'].includes(t) && (
        <Field label="Company Name" value={form.company_name} onChange={v => set('company_name', v)} />
      )}
      <Field
        label={t === 'vendor' || t === 'tpa' ? 'Contact Person Name' : 'Full Name'}
        value={form.name}
        onChange={v => set('name', v)}
      />
      <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} type="tel" />
      <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
      <Field label="City" value={form.city} onChange={v => set('city', v)} />

      {/* Adjuster */}
      {t === 'adjuster' && (
        <>
          <Field label="Carrier" value={form.carrier} onChange={v => set('carrier', v)} placeholder="e.g. State Farm" />
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">TPA</label>
            <select value={form.tpa_id} onChange={e => set('tpa_id', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="">— No TPA —</option>
              {tpas.map(t => <option key={t.id} value={t.id}>{t.company_name || t.name}</option>)}
            </select>
          </div>
        </>
      )}

      {/* TPA */}
      {t === 'tpa' && (
        <Field label="Billing Contact" value={form.billing_contact} onChange={v => set('billing_contact', v)} />
      )}

      {/* Partner */}
      {t === 'partner' && (
        <>
          <SelectField label="Category" value={form.contact_category} onChange={v => set('contact_category', v)} options={PARTNER_CATEGORIES} />
          <Field label="Role / Title" value={form.role} onChange={v => set('role', v)} />
          <Field label="Source of Lead" value={form.source_of_lead} onChange={v => set('source_of_lead', v)} />
          <Field label="Referral Count" value={form.referral_count} onChange={v => set('referral_count', v)} type="number" />
          <Field label="Last Contact Date" value={form.date_contacted} onChange={v => set('date_contacted', v)} type="date" />
        </>
      )}

      {/* Property Owner */}
      {t === 'property_owner' && (
        <>
          <SelectField label="Category" value={form.contact_category} onChange={v => set('contact_category', v)} options={OWNER_CATEGORIES} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="# Properties" value={form.num_properties} onChange={v => set('num_properties', v)} type="number" />
            <Field label="Active Listings" value={form.active_listings} onChange={v => set('active_listings', v)} type="number" />
          </div>
          <Field label="Referral Source" value={form.referral_source} onChange={v => set('referral_source', v)} />
        </>
      )}

      {/* Vendor */}
      {t === 'vendor' && (
        <>
          <SelectField label="Service Category" value={form.contact_category} onChange={v => set('contact_category', v)} options={VENDOR_CATEGORIES} />
          <Field label="Service Type (detail)" value={form.service_type} onChange={v => set('service_type', v)} placeholder="e.g. Water damage, mold..." />
          <div className="flex items-center gap-2 py-1">
            <input type="checkbox" id="preferred_vendor" checked={form.preferred_vendor}
              onChange={e => set('preferred_vendor', e.target.checked)}
              className="rounded border-gray-300 text-navy" />
            <label htmlFor="preferred_vendor" className="text-sm text-gray-700">Preferred Vendor</label>
          </div>
          <Field label="Commission Agreement" value={form.commission_agreement} onChange={v => set('commission_agreement', v)} />
        </>
      )}

      {/* Lead */}
      {t === 'lead' && (
        <>
          <Field label="Company" value={form.company_name} onChange={v => set('company_name', v)} />
          <Field label="Date Contacted" value={form.date_contacted} onChange={v => set('date_contacted', v)} type="date" />
          <SelectField label="Response Status" value={form.response_status} onChange={v => set('response_status', v)} options={RESPONSE_STATUSES} />
          <Field label="Follow-up Date" value={form.follow_up_date} onChange={v => set('follow_up_date', v)} type="date" />
        </>
      )}

      {/* Policyholder / Client */}
      {t === 'policyholder' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="# Adults" value={form.num_adults} onChange={v => set('num_adults', v)} type="number" />
          <Field label="# Children" value={form.num_children} onChange={v => set('num_children', v)} type="number" />
        </div>
      )}

      <TextArea label="Notes" value={form.notes} onChange={v => set('notes', v)} />
    </SlidePanel>
  )
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

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
