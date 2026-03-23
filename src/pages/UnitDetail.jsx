import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Phone, Mail, ExternalLink, Edit2, Wrench, Plus, Archive, Trash2 } from 'lucide-react'
import { useUnitDetail } from '../hooks/useUnitDetail'
import { supabase } from '../lib/supabase'
import UnitStatusBadge from '../components/inventory/UnitStatusBadge'
import PhotoGallery from '../components/inventory/PhotoGallery'
import DocumentsSection from '../components/documents/DocumentsSection'
import NotesLog from '../components/placements/NotesLog'
import StatusBadge from '../components/placements/StatusBadge'
import EditUnitPanel from '../components/inventory/EditUnitPanel'
import MaintenanceRequestPanel from '../components/inventory/MaintenanceRequestPanel'

const UNIT_STATUSES = ['available', 'occupied', 'reserved', 'inactive']
const TIER_LABELS = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' }

const URGENCY_COLORS = {
  low: 'text-gray-500 bg-gray-100',
  medium: 'text-blue-700 bg-blue-100',
  high: 'text-amber-700 bg-amber-100',
  emergency: 'text-red-700 bg-red-100',
}

const CONDITION_COLORS = {
  Excellent: 'text-green-700 bg-green-100',
  Good: 'text-blue-700 bg-blue-100',
  Fair: 'text-amber-700 bg-amber-100',
  Poor: 'text-red-700 bg-red-100',
}

function fmt(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return '—' }
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

function SidebarAction({ icon, label, onClick, disabled, className = 'text-gray-600 hover:bg-slate-100 hover:text-gray-800' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
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

export default function UnitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { unit, notes, photos, placements, invoices, loading, error, updateStatus, addNote, uploadPhoto, deletePhoto, refetch } = useUnitDetail(id)

  const [changingStatus, setChangingStatus] = useState(false)
  const [activeSection, setActiveSection] = useState('sec-details')
  const [showEdit, setShowEdit] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleArchive() {
    setArchiving(true)
    await supabase.from('units').update({ is_archived: true }).eq('id', id)
    navigate('/inventory')
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from('units').delete().eq('id', id)
    if (error) {
      setDeleteError(error.message.includes('foreign key') || error.message.includes('violates')
        ? 'Cannot delete — this unit is linked to placements. Try archiving instead.'
        : error.message)
      setDeleting(false)
    } else {
      navigate('/inventory')
    }
  }
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [conditionReports, setConditionReports] = useState([])

  useEffect(() => {
    if (!id) return
    supabase.from('maintenance_requests').select('*, vendor:assigned_vendor_id(name, company_name)')
      .eq('unit_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setMaintenanceRequests(data || []))
    supabase.from('condition_reports').select('*').eq('unit_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setConditionReports(data || []))
  }, [id])

  function refreshExtra() {
    supabase.from('maintenance_requests').select('*, vendor:assigned_vendor_id(name, company_name)')
      .eq('unit_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setMaintenanceRequests(data || []))
    supabase.from('condition_reports').select('*').eq('unit_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setConditionReports(data || []))
  }

  async function handleStatus(s) {
    setChangingStatus(true)
    await updateStatus(s)
    setChangingStatus(false)
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  useEffect(() => {
    if (!unit) return
    const els = document.querySelectorAll('[id^="sec-"]')
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) }) },
      { rootMargin: '-10% 0px -85% 0px', threshold: 0 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [unit])

  if (loading) {
    return (
      <div className="flex min-h-full animate-pulse">
        <div className="w-52 shrink-0 h-screen bg-white/40 border-r border-slate-200/40" />
        <div className="flex-1 p-8"><div className="max-w-3xl bg-white/50 rounded-xl h-[600px]" /></div>
      </div>
    )
  }

  if (error || !unit) {
    return <div className="p-6 text-red-600 text-sm">{error || 'Unit not found.'}</div>
  }

  const openRequests = maintenanceRequests.filter(r => r.status === 'open').length
  const hasVendor = unit.vendor_name || unit.vendor?.name

  const sections = [
    { id: 'sec-details', label: 'Property Details' },
    { id: 'sec-photos', label: 'Photos' },
    ...(hasVendor ? [{ id: 'sec-vendor', label: 'Vendor / Owner' }] : []),
    { id: 'sec-maintenance', label: `Maintenance${openRequests > 0 ? ` (${openRequests})` : ''}` },
    { id: 'sec-conditions', label: 'Condition Reports' },
    { id: 'sec-placements', label: 'Placement History' },
    { id: 'sec-billing', label: 'Billing History' },
    { id: 'sec-documents', label: 'Documents' },
    { id: 'sec-notes', label: 'Notes' },
  ]

  return (
    <div className="flex min-h-full">
      {/* Detail Sidebar */}
      <aside className="w-52 shrink-0 sticky top-0 h-screen overflow-y-auto bg-white/50 backdrop-blur-sm border-r border-slate-200/40 flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <button onClick={() => navigate('/inventory')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <ArrowLeft size={13} /> Inventory
          </button>
          <h2 className="font-display font-semibold text-navy text-[15px] leading-snug">{unit.property_name}</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{unit.unit_id}</p>
          <div className="mt-2.5"><UnitStatusBadge status={unit.status} /></div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-2">Status</p>
          <div className="flex flex-wrap gap-1">
            {UNIT_STATUSES.map(s => (
              <button key={s} disabled={changingStatus || unit.status === s} onClick={() => handleStatus(s)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize transition-colors disabled:opacity-50 ${
                  unit.status === s ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-3 border-b border-slate-100 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Actions</p>
          <SidebarAction icon={<Edit2 size={13} />} label="Edit Unit" onClick={() => setShowEdit(true)} />
          <SidebarAction icon={<Wrench size={13} />} label="Log Maintenance" onClick={() => setShowMaintenance(true)} />
          <SidebarAction icon={<Archive size={13} />} label={archiving ? 'Archiving...' : 'Archive Unit'} onClick={handleArchive} disabled={archiving} className="text-amber-600 hover:bg-amber-50 hover:text-amber-700" />
          {!confirmDelete
            ? <SidebarAction icon={<Trash2 size={13} />} label="Delete Unit" onClick={() => setConfirmDelete(true)} className="text-red-400 hover:bg-red-50 hover:text-red-600" />
            : (
              <div className="px-3 py-1.5 space-y-1.5">
                <p className="text-[11px] text-red-500 font-medium">Delete this unit?</p>
                {deleteError && <p className="text-[10px] text-red-500 bg-red-50 rounded px-2 py-1 leading-snug">{deleteError}</p>}
                <div className="flex gap-1.5">
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 py-1 bg-red-500 text-white rounded text-[11px] font-medium hover:bg-red-600 disabled:opacity-50">
                    {deleting ? '...' : 'Yes, delete'}
                  </button>
                  <button onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                    className="flex-1 py-1 bg-gray-100 text-gray-600 rounded text-[11px]">
                    Cancel
                  </button>
                </div>
              </div>
            )
          }
        </div>

        <nav className="px-3 py-3 space-y-0.5 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Sections</p>
          {sections.map(s => <NavItem key={s.id} id={s.id} label={s.label} active={activeSection} onNav={scrollTo} />)}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 xl:p-8">
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm divide-y divide-gray-100/80 overflow-hidden">

          <div id="sec-details" className="px-8 py-6">
            <p className="section-label">Property Details</p>
            <InfoRow label="Address" value={unit.address} />
            <InfoRow label="City" value={unit.city && unit.state ? `${unit.city}, ${unit.state} ${unit.zip || ''}`.trim() : null} />
            <InfoRow label="Bedrooms" value={unit.bedrooms ? `${unit.bedrooms} bd / ${unit.bathrooms} ba` : null} />
            <InfoRow label="Max Occupants" value={unit.max_occupants} />
            <InfoRow label="Sq Ft" value={unit.sq_ft ? `${unit.sq_ft.toLocaleString()} sq ft` : null} />
            <InfoRow label="Tier" value={unit.tier ? TIER_LABELS[unit.tier] : null} />
            <InfoRow label="Monthly Rate" value={unit.monthly_rate ? `$${Number(unit.monthly_rate).toLocaleString()}/mo` : null} />
            <InfoRow label="Daily Rate" value={unit.daily_rate ? `$${Number(unit.daily_rate).toLocaleString()}/day` : null} />
            <InfoRow label="Last Updated" value={fmt(unit.last_updated)} />
            <div className="flex flex-wrap gap-2 mt-4">
              {unit.ale_eligible && <span className="badge-blue">ALE Eligible</span>}
              {unit.pet_friendly && <span className="badge-green">Pet Friendly</span>}
              {unit.accessibility && <span className="badge-blue">Accessible</span>}
              {!unit.ale_eligible && <span className="badge-gray">Non-ALE</span>}
            </div>
            {unit.amenities?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {unit.amenities.map((a, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4 mt-4">
              {unit.property_link && (
                <a href={unit.property_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline">
                  <ExternalLink size={12} /> Property Link
                </a>
              )}
              {unit.dropbox_link && (
                <a href={unit.dropbox_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline">
                  <ExternalLink size={12} /> Dropbox
                </a>
              )}
            </div>
          </div>

          <div id="sec-photos" className="px-8 py-6">
            <p className="section-label">Photos</p>
            <PhotoGallery photos={photos} onUpload={uploadPhoto} onDelete={deletePhoto} />
          </div>

          {hasVendor && (
            <div id="sec-vendor" className="px-8 py-6">
              <p className="section-label">Vendor / Property Owner</p>
              <InfoRow label="Name" value={unit.vendor_name || unit.vendor?.name} />
              <InfoRow label="Phone" value={unit.vendor_phone || unit.vendor?.phone} />
              <InfoRow label="Email" value={unit.vendor_email || unit.vendor?.email} />
              {unit.vendor?.coi_expiration && <InfoRow label="COI Expiry" value={fmt(unit.vendor.coi_expiration)} />}
              <div className="flex items-center gap-4 mt-4 pt-1">
                {(unit.vendor_phone || unit.vendor?.phone) && (
                  <a href={`tel:${unit.vendor_phone || unit.vendor?.phone}`} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline"><Phone size={12} /> Call</a>
                )}
                {(unit.vendor_email || unit.vendor?.email) && (
                  <a href={`mailto:${unit.vendor_email || unit.vendor?.email}`} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline"><Mail size={12} /> Email</a>
                )}
                {unit.vendor?.id && (
                  <button onClick={() => navigate(`/contacts/${unit.vendor.id}`)} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline">
                    <ExternalLink size={12} /> View Contact
                  </button>
                )}
              </div>
            </div>
          )}

          <div id="sec-maintenance" className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label mb-0">Maintenance {openRequests > 0 && <span className="ml-1.5 text-amber-600 normal-case">({openRequests} open)</span>}</p>
              <button onClick={() => setShowMaintenance(true)} className="text-xs text-navy hover:underline">+ Log Request</button>
            </div>
            {maintenanceRequests.length === 0 ? (
              <p className="text-sm text-gray-400">No maintenance requests.</p>
            ) : maintenanceRequests.map(r => (
              <div key={r.id} className="py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-700 flex-1">{r.description}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${URGENCY_COLORS[r.urgency] || ''}`}>{r.urgency}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs capitalize ${r.status === 'resolved' ? 'text-green-600' : r.status === 'in_progress' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                  {r.vendor && <span className="text-xs text-gray-400">{r.vendor.company_name || r.vendor.name}</span>}
                  <span className="text-xs text-gray-400">{fmt(r.created_at)}</span>
                </div>
                {r.resolution_notes && <p className="text-xs text-gray-500 mt-1 italic">{r.resolution_notes}</p>}
              </div>
            ))}
          </div>

          <div id="sec-conditions" className="px-8 py-6">
            <p className="section-label">Condition Reports</p>
            {conditionReports.length === 0 ? (
              <p className="text-sm text-gray-400">No condition reports for this unit.</p>
            ) : conditionReports.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{r.report_type === 'move_in' ? 'Move-in' : 'Move-out'} Report</span>
                <div className="flex items-center gap-3">
                  {r.overall_condition && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[r.overall_condition] || 'bg-gray-100 text-gray-600'}`}>
                      {r.overall_condition}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{fmt(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          <div id="sec-placements" className="px-8 py-6">
            <p className="section-label">Placement History</p>
            {placements.length === 0 ? (
              <p className="text-sm text-gray-400">No placements yet.</p>
            ) : placements.map(p => (
              <div key={p.id} onClick={() => navigate(`/placements/${p.id}`)}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer -mx-2 px-2 rounded-lg hover:bg-sky-50/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-700">{p.policyholder?.name}</p>
                  <p className="text-xs text-gray-400">#{p.claim_number} · {fmt(p.move_in_date)} → {fmt(p.move_out_date)}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>

          <div id="sec-billing" className="px-8 py-6">
            <p className="section-label">Billing History</p>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No invoices for this unit.</p>
            ) : (
              <>
                <div className="flex gap-6 text-xs text-gray-400 mb-4">
                  <span>Total invoiced: <strong className="text-gray-700">${invoices.reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString()}</strong></span>
                  <span>Collected: <strong className="text-green-600">${invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0).toLocaleString()}</strong></span>
                </div>
                {invoices.map(inv => (
                  <div key={inv.id} onClick={() => navigate(`/billing/${inv.id}`)}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer -mx-2 px-2 rounded-lg hover:bg-sky-50/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{inv.invoice_number || 'Invoice'}</p>
                      <p className="text-xs text-gray-400">{inv.carrier_tpa_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">${Number(inv.total || 0).toLocaleString()}</p>
                      <span className={`text-xs capitalize ${inv.status === 'paid' ? 'text-green-600' : inv.status === 'overdue' ? 'text-red-600' : inv.status === 'sent' ? 'text-blue-600' : 'text-gray-400'}`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div id="sec-documents" className="px-8 py-6">
            <p className="section-label">Documents</p>
            <DocumentsSection entityType="unit" entityId={unit.id} />
          </div>

          <div id="sec-notes" className="px-8 py-6">
            <p className="section-label">Notes</p>
            <NotesLog notes={notes} onAdd={addNote} />
          </div>

        </div>
      </div>

      {showEdit && <EditUnitPanel unit={unit} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refetch() }} />}
      {showMaintenance && <MaintenanceRequestPanel unit={unit} onClose={() => setShowMaintenance(false)} onSaved={() => { setShowMaintenance(false); refreshExtra() }} />}
    </div>
  )
}
