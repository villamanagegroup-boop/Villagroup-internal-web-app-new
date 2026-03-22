import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO, differenceInDays, isValid } from 'date-fns'
import {
  ArrowLeft, Phone, Mail, ExternalLink,
  AlertTriangle, Clock, Edit2, Check, X,
} from 'lucide-react'
import { useContactDetail } from '../hooks/useContactDetail'
import EditContactPanel from '../components/contacts/EditContactPanel'
import StatusBadge from '../components/placements/StatusBadge'
import UnitStatusBadge from '../components/inventory/UnitStatusBadge'
import DocumentsSection from '../components/documents/DocumentsSection'

function fmt(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return '—' }
}

function coiStatus(date) {
  if (!date) return null
  const d = parseISO(date)
  if (!isValid(d)) return null
  const days = differenceInDays(d, new Date())
  if (days < 0) return { label: 'Expired', color: 'text-red-600', bg: 'bg-red-50' }
  if (days <= 30) return { label: `Expires in ${days}d`, color: 'text-amber-600', bg: 'bg-amber-50' }
  return { label: `Expires ${fmt(date)}`, color: 'text-green-600', bg: 'bg-green-50' }
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 flex-1 min-w-0">{value}</span>
    </div>
  )
}

function EditableNotes({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {value || <span className="text-gray-400 italic">No notes</span>}
        </p>
        <button onClick={() => { setDraft(value || ''); setEditing(true) }} className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0">
          <Edit2 size={14} className="text-gray-400" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={4} autoFocus
        className="w-full text-sm border border-gray-200/80 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white/80" />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-navy to-navy-500 text-white rounded-lg text-xs font-medium">
          <Check size={12} /> {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  )
}

function SidebarAction({ icon, label, onClick, disabled, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:bg-slate-100 hover:text-gray-800 ${className}`}>
      {icon}{label}
    </button>
  )
}

function NavItem({ id, label, active, onNav }) {
  return (
    <button onClick={() => onNav(id)}
      className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
        active === id ? 'bg-navy/8 text-navy font-semibold' : 'text-gray-400 hover:text-gray-700'
      }`}>
      {label}
    </button>
  )
}

const TYPE_LABELS = {
  adjuster: 'Adjuster',
  tpa: 'TPA',
  vendor: 'Vendor',
  policyholder: 'Client / Family',
  partner: 'Partner & Referral',
  property_owner: 'Property Owner / Host',
  lead: 'Lead / Outreach',
}

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contact, related, loading, error, updateLastContact, updateField, refetch } = useContactDetail(id)
  const [markingContact, setMarkingContact] = useState(false)
  const [activeSection, setActiveSection] = useState('sec-info')
  const [showEdit, setShowEdit] = useState(false)

  async function handleMarkContact() {
    setMarkingContact(true)
    await updateLastContact()
    setMarkingContact(false)
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  useEffect(() => {
    if (!contact) return
    const els = document.querySelectorAll('[id^="sec-"]')
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) }) },
      { rootMargin: '-10% 0px -85% 0px', threshold: 0 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [contact])

  const sections = useMemo(() => {
    if (!contact) return []
    const s = [{ id: 'sec-info', label: 'Contact Info' }]
    if (contact.type === 'adjuster') s.push({ id: 'sec-placements', label: 'Placements' })
    if (contact.type === 'tpa') s.push({ id: 'sec-adjusters', label: 'Adjusters' }, { id: 'sec-placements', label: 'Placements' })
    if (contact.type === 'vendor') {
      if (contact.performance_notes) s.push({ id: 'sec-performance', label: 'Performance Notes' })
      s.push({ id: 'sec-units', label: 'Linked Units' }, { id: 'sec-placements', label: 'Placements' }, { id: 'sec-billing', label: 'Billing' })
    }
    if (contact.type === 'property_owner') {
      s.push({ id: 'sec-details', label: 'Owner Details' }, { id: 'sec-units', label: 'Linked Units' }, { id: 'sec-placements', label: 'Placements' }, { id: 'sec-billing', label: 'Billing' })
    }
    if (contact.type === 'policyholder') {
      s.push({ id: 'sec-details', label: 'Client Details' }, { id: 'sec-placements', label: 'Placements' })
    }
    if (contact.type === 'partner') s.push({ id: 'sec-details', label: 'Partner Details' })
    if (contact.type === 'lead') s.push({ id: 'sec-details', label: 'Outreach Details' })
    s.push({ id: 'sec-documents', label: 'Documents' }, { id: 'sec-notes', label: 'Notes' })
    return s
  }, [contact])

  if (loading) {
    return (
      <div className="flex min-h-full animate-pulse">
        <div className="w-52 shrink-0 h-screen bg-white/40 border-r border-slate-200/40" />
        <div className="flex-1 p-8"><div className="max-w-3xl bg-white/50 rounded-xl h-[600px]" /></div>
      </div>
    )
  }

  if (error || !contact) {
    return <div className="p-6 text-red-600 text-sm">{error || 'Contact not found.'}</div>
  }

  const displayName = ['tpa', 'vendor', 'property_owner', 'partner'].includes(contact.type)
    ? (contact.company_name || contact.name)
    : contact.name
  const coi = contact.type === 'vendor' ? coiStatus(contact.coi_expiration) : null

  return (
    <div className="flex min-h-full">
      {/* Detail Sidebar */}
      <aside className="w-52 shrink-0 sticky top-0 h-screen overflow-y-auto bg-white/50 backdrop-blur-sm border-r border-slate-200/40 flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <button onClick={() => navigate('/contacts')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <ArrowLeft size={13} /> Contacts
          </button>
          <h2 className="font-display font-semibold text-navy text-[15px] leading-snug">{displayName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABELS[contact.type]}</p>
          {coi && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${coi.bg} ${coi.color}`}>
              <AlertTriangle size={10} /> {coi.label}
            </span>
          )}
        </div>

        <div className="px-3 py-3 border-b border-slate-100 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Actions</p>
          {contact.phone && <SidebarAction icon={<Phone size={13} />} label="Call" onClick={() => window.location.href = `tel:${contact.phone}`} />}
          {contact.email && <SidebarAction icon={<Mail size={13} />} label="Email" onClick={() => window.location.href = `mailto:${contact.email}`} />}
          <SidebarAction icon={<Clock size={13} />} label={markingContact ? 'Logging...' : 'Log Contact'} onClick={handleMarkContact} disabled={markingContact} />
          <SidebarAction icon={<Edit2 size={13} />} label="Edit Contact" onClick={() => setShowEdit(true)} />
        </div>

        <nav className="px-3 py-3 space-y-0.5 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Sections</p>
          {sections.map(s => <NavItem key={s.id} id={s.id} label={s.label} active={activeSection} onNav={scrollTo} />)}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 xl:p-8">
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm divide-y divide-gray-100/80 overflow-hidden">

          {/* Contact Info */}
          <div id="sec-info" className="px-8 py-6">
            <p className="section-label">Contact Info</p>
            <InfoRow label="Name" value={contact.name} />
            {['tpa', 'vendor'].includes(contact.type) && <InfoRow label="Company" value={contact.company_name} />}
            <InfoRow label="Phone" value={contact.phone} />
            <InfoRow label="Email" value={contact.email} />
            <InfoRow label="Last Contact" value={contact.last_contact_date ? fmt(contact.last_contact_date) : null} />
            {contact.type === 'adjuster' && (
              <>
                <InfoRow label="Carrier" value={contact.carrier} />
                {contact.tpa && (
                  <div className="flex items-start gap-4 py-2.5 border-b border-gray-50">
                    <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">TPA</span>
                    <button onClick={() => navigate(`/contacts/${contact.tpa.id}`)} className="text-sm text-navy hover:underline">
                      {contact.tpa.company_name || contact.tpa.name}
                    </button>
                  </div>
                )}
              </>
            )}
            {contact.type === 'tpa' && <InfoRow label="Billing Contact" value={contact.billing_contact} />}
            {contact.type === 'vendor' && coi && (
              <div className="flex items-start gap-4 py-2.5 border-b border-gray-50">
                <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">COI Expiry</span>
                <span className={`text-sm font-medium ${coi.color}`}>{fmt(contact.coi_expiration)}</span>
              </div>
            )}
          </div>

          {/* Vendor: Performance Notes */}
          {contact.type === 'vendor' && contact.performance_notes && (
            <div id="sec-performance" className="px-8 py-6">
              <p className="section-label">Performance Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{contact.performance_notes}</p>
            </div>
          )}

          {/* Vendor / Property Owner: Linked Units */}
          {['vendor', 'property_owner'].includes(contact.type) && (
            <div id="sec-units" className="px-8 py-6">
              <p className="section-label">Linked Units</p>
              {!related.units?.length ? (
                <p className="text-sm text-gray-400">No units linked.</p>
              ) : related.units.map(u => (
                <div key={u.id} onClick={() => navigate(`/inventory/${u.id}`)}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer -mx-2 px-2 rounded-lg hover:bg-sky-50/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{u.property_name}</p>
                    <p className="text-xs text-gray-400">{u.unit_id} · {u.city}, {u.state}</p>
                  </div>
                  <UnitStatusBadge status={u.status} />
                </div>
              ))}
            </div>
          )}

          {/* TPA: Adjusters */}
          {contact.type === 'tpa' && (
            <div id="sec-adjusters" className="px-8 py-6">
              <p className="section-label">Adjusters</p>
              {!related.adjusters?.length ? (
                <p className="text-sm text-gray-400">No adjusters linked.</p>
              ) : related.adjusters.map(a => (
                <div key={a.id} onClick={() => navigate(`/contacts/${a.id}`)}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer -mx-2 px-2 rounded-lg hover:bg-sky-50/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.carrier}</p>
                  </div>
                  <div className="flex gap-3">
                    {a.phone && <a href={`tel:${a.phone}`} onClick={e => e.stopPropagation()} className="text-navy"><Phone size={14} /></a>}
                    {a.email && <a href={`mailto:${a.email}`} onClick={e => e.stopPropagation()} className="text-navy"><Mail size={14} /></a>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Property Owner: Details */}
          {contact.type === 'property_owner' && (
            <div id="sec-details" className="px-8 py-6">
              <p className="section-label">Owner Details</p>
              <InfoRow label="Category" value={contact.contact_category} />
              <InfoRow label="City" value={contact.city} />
              <InfoRow label="# Properties" value={contact.num_properties} />
              <InfoRow label="Active Listings" value={contact.active_listings} />
              <InfoRow label="Referral Source" value={contact.referral_source} />
            </div>
          )}

          {/* Policyholder: Client Details */}
          {contact.type === 'policyholder' && (
            <div id="sec-details" className="px-8 py-6">
              <p className="section-label">Client Details</p>
              <InfoRow label="Adults" value={contact.num_adults} />
              <InfoRow label="Children" value={contact.num_children} />
            </div>
          )}

          {/* Partner: Details */}
          {contact.type === 'partner' && (
            <div id="sec-details" className="px-8 py-6">
              <p className="section-label">Partner Details</p>
              <InfoRow label="Category" value={contact.contact_category} />
              <InfoRow label="Role" value={contact.role} />
              <InfoRow label="City" value={contact.city} />
              <InfoRow label="Source of Lead" value={contact.source_of_lead} />
              <InfoRow label="Referral Count" value={contact.referral_count} />
              <InfoRow label="Last Contact" value={contact.date_contacted ? fmt(contact.date_contacted) : null} />
            </div>
          )}

          {/* Lead: Outreach Details */}
          {contact.type === 'lead' && (
            <div id="sec-details" className="px-8 py-6">
              <p className="section-label">Outreach Details</p>
              <InfoRow label="Category" value={contact.contact_category} />
              <InfoRow label="Company" value={contact.company_name} />
              <InfoRow label="City" value={contact.city} />
              <InfoRow label="Date Contacted" value={contact.date_contacted ? fmt(contact.date_contacted) : null} />
              <InfoRow label="Response Status" value={contact.response_status} />
              <InfoRow label="Follow-up Date" value={contact.follow_up_date ? fmt(contact.follow_up_date) : null} />
            </div>
          )}

          {/* Placements (adjuster, tpa, vendor, property_owner, policyholder) */}
          {['adjuster', 'tpa', 'vendor', 'property_owner', 'policyholder'].includes(contact.type) && (
            <div id="sec-placements" className="px-8 py-6">
              <p className="section-label">Placement History</p>
              {!related.placements?.length ? (
                <p className="text-sm text-gray-400">No placements.</p>
              ) : related.placements.map(p => (
                <div key={p.id} onClick={() => navigate(`/placements/${p.id}`)}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer -mx-2 px-2 rounded-lg hover:bg-sky-50/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {contact.type === 'policyholder' ? `Claim #${p.claim_number}` : p.policyholder?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {contact.type === 'policyholder'
                        ? `${p.unit?.property_name} · ${p.adjuster?.name}`
                        : `#${p.claim_number}${contact.type === 'tpa' && p.adjuster?.name ? ` · ${p.adjuster.name}` : ''}`
                      }
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}

          {/* Billing (vendor, property_owner) */}
          {['vendor', 'property_owner'].includes(contact.type) && related.invoices?.length > 0 && (
            <div id="sec-billing" className="px-8 py-6">
              <p className="section-label">Billing</p>
              <div className="flex gap-6 text-xs text-gray-400 mb-4">
                <span>Invoiced: <strong className="text-gray-700">${related.invoices.reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString()}</strong></span>
                <span>Collected: <strong className="text-green-600">${related.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString()}</strong></span>
              </div>
              {related.invoices.map(inv => (
                <div key={inv.id} onClick={() => navigate(`/billing/${inv.id}`)}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer -mx-2 px-2 rounded-lg hover:bg-sky-50/30 transition-colors">
                  <p className="text-sm text-gray-700">{inv.invoice_number || 'Invoice'}</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">${Number(inv.total || 0).toLocaleString()}</p>
                    <span className={`text-xs capitalize ${inv.status === 'paid' ? 'text-green-600' : inv.status === 'overdue' ? 'text-red-600' : inv.status === 'sent' ? 'text-blue-600' : 'text-gray-400'}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div id="sec-documents" className="px-8 py-6">
            <p className="section-label">Documents</p>
            <DocumentsSection entityType="contact" entityId={contact.id} />
          </div>

          <div id="sec-notes" className="px-8 py-6">
            <p className="section-label">Notes</p>
            <EditableNotes value={contact.notes} onSave={v => updateField('notes', v)} />
          </div>

        </div>
      </div>

      {showEdit && <EditContactPanel contact={contact} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refetch() }} />}
    </div>
  )
}
