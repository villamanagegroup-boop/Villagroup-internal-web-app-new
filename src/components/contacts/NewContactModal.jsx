import { useState, useEffect } from 'react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const TAB_CONFIG = {
  clients:   { type: 'policyholder',   prefix: 'CLI', label: 'Client' },
  adjusters: { type: 'adjuster',       prefix: 'ADJ', label: 'Adjuster' },
  tpa:       { type: 'tpa',            prefix: 'TPA', label: 'TPA' },
  partners:  { type: 'partner',        prefix: 'PTR', label: 'Partner' },
  owners:    { type: 'property_owner', prefix: 'OWN', label: 'Property Owner' },
  vendors:   { type: 'vendor',         prefix: 'VND', label: 'Vendor' },
  leads:     { type: 'lead',           prefix: 'LED', label: 'Lead' },
}

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

const LEAD_CATEGORIES = [
  ...PARTNER_CATEGORIES, ...OWNER_CATEGORIES, ...VENDOR_CATEGORIES,
]

const RESPONSE_STATUSES = ['Contacted', 'Responded', 'No Response', 'Not Interested', 'Follow Up']

const TABS = [
  { id: 'clients',   label: 'Client' },
  { id: 'adjusters', label: 'Adjuster' },
  { id: 'tpa',       label: 'TPA' },
  { id: 'partners',  label: 'Partner' },
  { id: 'owners',    label: 'Owner' },
  { id: 'vendors',   label: 'Vendor' },
  { id: 'leads',     label: 'Lead' },
]

export default function NewContactModal({ defaultTab = 'clients', onClose, onCreated }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [nextId, setNextId] = useState('')
  const [tpas, setTpas] = useState([])

  const cfg = TAB_CONFIG[activeTab]

  useEffect(() => {
    supabase.from('contacts').select('id, company_name, name').eq('type', 'tpa').order('company_name')
      .then(({ data }) => setTpas(data || []))
  }, [])

  useEffect(() => {
    async function genId() {
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('type', cfg.type)
      setNextId(`${cfg.prefix}-${String((count || 0) + 1).padStart(3, '0')}`)
    }
    genId()
    setForm({})
    setError(null)
  }, [activeTab])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    const primaryName = ['vendors', 'tpa'].includes(activeTab)
      ? (form.company_name || form.name)
      : (form.name || form.company_name)
    if (!primaryName) { setError('Name is required.'); return }

    setSaving(true)
    setError(null)

    const payload = {
      type: cfg.type,
      contact_ref_id: nextId,
      name: form.name || null,
      company_name: form.company_name || null,
      phone: form.phone || null,
      email: form.email || null,
      city: form.city || null,
      contact_category: form.contact_category || null,
      notes: form.notes || null,
    }

    if (activeTab === 'clients') {
      payload.num_adults = form.num_adults ? Number(form.num_adults) : null
      payload.num_children = form.num_children ? Number(form.num_children) : null
    }
    if (activeTab === 'adjusters') {
      payload.carrier = form.carrier || null
      payload.tpa_id = form.tpa_id || null
    }
    if (activeTab === 'tpa') {
      payload.billing_contact = form.billing_contact || null
    }
    if (activeTab === 'partners') {
      payload.role = form.role || null
      payload.source_of_lead = form.source_of_lead || null
      payload.date_contacted = form.date_contacted || null
      payload.referral_count = form.referral_count ? Number(form.referral_count) : 0
    }
    if (activeTab === 'owners') {
      payload.num_properties = form.num_properties ? Number(form.num_properties) : null
      payload.active_listings = form.active_listings ? Number(form.active_listings) : null
      payload.referral_source = form.referral_source || null
    }
    if (activeTab === 'vendors') {
      payload.service_type = form.service_type || null
      payload.preferred_vendor = form.preferred_vendor || false
      payload.commission_agreement = form.commission_agreement || null
    }
    if (activeTab === 'leads') {
      payload.date_contacted = form.date_contacted || null
      payload.response_status = form.response_status || null
      payload.follow_up_date = form.follow_up_date || null
    }

    const { data, error: err } = await supabase.from('contacts').insert(payload).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    onCreated(data)
  }

  const footer = (
    <button onClick={handleSubmit} disabled={saving}
      className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
      {saving ? 'Saving...' : `Add ${cfg.label}`}
    </button>
  )

  return (
    <SlidePanel onClose={onClose} title="New Contact" subtitle={`ID: ${nextId || '...'}`} footer={footer}>

      {/* Type switcher */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-2">Contact Type</label>
        <div className="flex flex-wrap gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === t.id ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* ── Clients ── */}
      {activeTab === 'clients' && (
        <>
          <Field label="Family / Client Name *" value={form.name || ''} onChange={v => set('name', v)} />
          <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="# Adults" value={form.num_adults || ''} onChange={v => set('num_adults', v)} type="number" />
            <Field label="# Children" value={form.num_children || ''} onChange={v => set('num_children', v)} type="number" />
          </div>
          <TextArea label="Special Needs / Notes" value={form.notes || ''} onChange={v => set('notes', v)} />
        </>
      )}

      {/* ── Adjusters ── */}
      {activeTab === 'adjusters' && (
        <>
          <Field label="Full Name *" value={form.name || ''} onChange={v => set('name', v)} />
          <Field label="Carrier (Insurance Company)" value={form.carrier || ''} onChange={v => set('carrier', v)} placeholder="e.g. State Farm" />
          <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
          <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">TPA (if applicable)</label>
            <select value={form.tpa_id || ''} onChange={e => set('tpa_id', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
              <option value="">— No TPA —</option>
              {tpas.map(t => <option key={t.id} value={t.id}>{t.company_name || t.name}</option>)}
            </select>
          </div>
          <TextArea label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} />
        </>
      )}

      {/* ── TPA ── */}
      {activeTab === 'tpa' && (
        <>
          <Field label="TPA Company Name *" value={form.company_name || ''} onChange={v => set('company_name', v)} />
          <Field label="Primary Contact Name" value={form.name || ''} onChange={v => set('name', v)} />
          <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
          <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
          <Field label="Billing Contact" value={form.billing_contact || ''} onChange={v => set('billing_contact', v)} placeholder="Name or email for billing" />
          <TextArea label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} />
        </>
      )}

      {/* ── Partners & Referrals ── */}
      {activeTab === 'partners' && (
        <>
          <Field label="Company Name *" value={form.company_name || ''} onChange={v => set('company_name', v)} />
          <Field label="Contact Name" value={form.name || ''} onChange={v => set('name', v)} />
          <SelectField label="Category" value={form.contact_category || ''} onChange={v => set('contact_category', v)}
            options={PARTNER_CATEGORIES} />
          <Field label="Role / Title" value={form.role || ''} onChange={v => set('role', v)} />
          <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
          <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
          <Field label="Source of Lead" value={form.source_of_lead || ''} onChange={v => set('source_of_lead', v)} />
          <Field label="Last Contact Date" value={form.date_contacted || ''} onChange={v => set('date_contacted', v)} type="date" />
          <Field label="Referral Count" value={form.referral_count || ''} onChange={v => set('referral_count', v)} type="number" />
          <TextArea label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} />
        </>
      )}

      {/* ── Property Owners / Hosts ── */}
      {activeTab === 'owners' && (
        <>
          <Field label="Owner Name *" value={form.name || ''} onChange={v => set('name', v)} />
          <SelectField label="Category" value={form.contact_category || ''} onChange={v => set('contact_category', v)}
            options={OWNER_CATEGORIES} />
          <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
          <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="# Properties" value={form.num_properties || ''} onChange={v => set('num_properties', v)} type="number" />
            <Field label="Active Listings" value={form.active_listings || ''} onChange={v => set('active_listings', v)} type="number" />
          </div>
          <Field label="Referral Source" value={form.referral_source || ''} onChange={v => set('referral_source', v)} />
          <TextArea label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} />
        </>
      )}

      {/* ── Vendors ── */}
      {activeTab === 'vendors' && (
        <>
          <Field label="Vendor / Business Name *" value={form.company_name || ''} onChange={v => set('company_name', v)} />
          <SelectField label="Service Category" value={form.contact_category || ''} onChange={v => set('contact_category', v)}
            options={VENDOR_CATEGORIES} />
          <Field label="Service Type (detail)" value={form.service_type || ''} onChange={v => set('service_type', v)}
            placeholder="e.g. Water damage, mold remediation..." />
          <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
          <Field label="Contact Person Name" value={form.name || ''} onChange={v => set('name', v)} />
          <Field label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} type="tel" />
          <Field label="Email" value={form.email || ''} onChange={v => set('email', v)} type="email" />
          <div className="flex items-center gap-2 py-1">
            <input type="checkbox" id="preferred_vendor" checked={form.preferred_vendor || false}
              onChange={e => set('preferred_vendor', e.target.checked)}
              className="rounded border-gray-300 text-navy focus:ring-navy/30" />
            <label htmlFor="preferred_vendor" className="text-sm text-gray-700">Preferred Vendor</label>
          </div>
          <Field label="Commission Agreement" value={form.commission_agreement || ''} onChange={v => set('commission_agreement', v)}
            placeholder="e.g. 10% referral fee" />
          <TextArea label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} />
        </>
      )}

      {/* ── Leads / Outreach ── */}
      {activeTab === 'leads' && (
        <>
          <Field label="Contact Name *" value={form.name || ''} onChange={v => set('name', v)} />
          <Field label="Company" value={form.company_name || ''} onChange={v => set('company_name', v)} />
          <SelectField label="Category / Type" value={form.contact_category || ''} onChange={v => set('contact_category', v)}
            options={LEAD_CATEGORIES} />
          <Field label="City" value={form.city || ''} onChange={v => set('city', v)} />
          <Field label="Date Contacted" value={form.date_contacted || ''} onChange={v => set('date_contacted', v)} type="date" />
          <SelectField label="Response Status" value={form.response_status || ''} onChange={v => set('response_status', v)}
            options={RESPONSE_STATUSES} />
          <Field label="Follow-up Date" value={form.follow_up_date || ''} onChange={v => set('follow_up_date', v)} type="date" />
          <TextArea label="Notes" value={form.notes || ''} onChange={v => set('notes', v)} />
        </>
      )}

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

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
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
