import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft, Phone, Mail, ExternalLink,
  Edit2, LogOut, Calendar, ClipboardList, Wrench,
} from 'lucide-react'
import { usePlacementDetail } from '../hooks/usePlacementDetail'
import { supabase } from '../lib/supabase'
import StatusBadge from '../components/placements/StatusBadge'
import ALEBar from '../components/placements/ALEBar'
import DocumentsSection from '../components/documents/DocumentsSection'
import MoveInChecklist from '../components/placements/MoveInChecklist'
import NotesLog from '../components/placements/NotesLog'
import ActivityTimeline from '../components/placements/ActivityTimeline'
import EditPlacementPanel from '../components/placements/EditPlacementPanel'
import DischargePanel from '../components/placements/DischargePanel'
import ExtensionRequestPanel from '../components/placements/ExtensionRequestPanel'
import ConditionReportPanel from '../components/placements/ConditionReportPanel'
import MaintenanceRequestPanel from '../components/inventory/MaintenanceRequestPanel'

const STATUSES = ['pending', 'active', 'discharged', 'cancelled']

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

function ContactLinks({ phone, email, id, navigate }) {
  if (!phone && !email && !id) return null
  return (
    <div className="flex items-center gap-4 mt-4 pt-1">
      {phone && <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline"><Phone size={12} /> Call</a>}
      {email && <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline"><Mail size={12} /> Email</a>}
      {id && <button onClick={() => navigate(`/contacts/${id}`)} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline"><ExternalLink size={12} /> View Profile</button>}
    </div>
  )
}

function SidebarAction({ icon, label, onClick, disabled, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-slate-100 hover:text-gray-800'
      }`}
    >
      {icon}{label}
    </button>
  )
}

function NavItem({ id, label, active, onNav }) {
  return (
    <button
      onClick={() => onNav(id)}
      className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
        active === id ? 'bg-navy/8 text-navy font-semibold' : 'text-gray-400 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

export default function PlacementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    placement, notes, activity, checklists, invoices,
    loading, error, addNote, updateStatus, toggleChecklistItem, refetch,
  } = usePlacementDetail(id)

  const [changingStatus, setChangingStatus] = useState(false)
  const [activeSection, setActiveSection] = useState('sec-overview')
  const [showEdit, setShowEdit] = useState(false)
  const [showDischarge, setShowDischarge] = useState(false)
  const [showExtension, setShowExtension] = useState(false)
  const [showCondition, setShowCondition] = useState(null)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [conditionReports, setConditionReports] = useState([])
  const [maintenanceRequests, setMaintenanceRequests] = useState([])

  useEffect(() => {
    if (!id) return
    supabase.from('condition_reports').select('*').eq('placement_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setConditionReports(data || []))
    supabase.from('maintenance_requests').select('*, vendor:assigned_vendor_id(name, company_name, phone)').eq('placement_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setMaintenanceRequests(data || []))
  }, [id])

  function refreshExtra() {
    supabase.from('condition_reports').select('*').eq('placement_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setConditionReports(data || []))
    supabase.from('maintenance_requests').select('*, vendor:assigned_vendor_id(name, company_name, phone)').eq('placement_id', id).order('created_at', { ascending: false })
      .then(({ data }) => setMaintenanceRequests(data || []))
  }

  async function handleStatusChange(s) {
    setChangingStatus(true)
    await updateStatus(s)
    setChangingStatus(false)
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  useEffect(() => {
    if (!placement) return
    const els = document.querySelectorAll('[id^="sec-"]')
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) }) },
      { rootMargin: '-10% 0px -85% 0px', threshold: 0 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [placement])

  if (loading) {
    return (
      <div className="flex min-h-full animate-pulse">
        <div className="w-52 shrink-0 h-screen bg-white/40 border-r border-slate-200/40" />
        <div className="flex-1 p-8"><div className="max-w-3xl bg-white/50 rounded-xl h-[600px]" /></div>
      </div>
    )
  }

  if (error || !placement) {
    return <div className="p-6 text-red-600 text-sm">{error || 'Placement not found.'}</div>
  }

  const ph = placement.policyholder
  const adj = placement.adjuster
  const unit = placement.unit
  const isActive = !['discharged', 'cancelled'].includes(placement.status)

  const sections = [
    { id: 'sec-overview', label: 'Overview' },
    { id: 'sec-policyholder', label: 'Policyholder' },
    { id: 'sec-claim', label: 'Claim Details' },
    ...(adj ? [{ id: 'sec-adjuster', label: 'Adjuster' }] : []),
    ...(unit ? [{ id: 'sec-unit', label: 'Housing Unit' }] : []),
    { id: 'sec-checklist', label: 'Checklist' },
    { id: 'sec-conditions', label: 'Condition Reports' },
    { id: 'sec-maintenance', label: 'Maintenance' },
    { id: 'sec-invoices', label: 'Invoices' },
    { id: 'sec-documents', label: 'Documents' },
    { id: 'sec-notes', label: 'Notes' },
    { id: 'sec-activity', label: 'Activity' },
  ]

  return (
    <div className="flex min-h-full">
      {/* Detail Sidebar */}
      <aside className="w-52 shrink-0 sticky top-0 h-screen overflow-y-auto bg-white/50 backdrop-blur-sm border-r border-slate-200/40 flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <button onClick={() => navigate('/placements')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <ArrowLeft size={13} /> Placements
          </button>
          <h2 className="font-display font-semibold text-navy text-[15px] leading-snug">{ph?.name ?? 'Unknown'}</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">#{placement.claim_number || '—'}</p>
          <div className="mt-2.5"><StatusBadge status={placement.status} /></div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 mb-2">Status</p>
          <div className="flex flex-wrap gap-1">
            {STATUSES.map(s => (
              <button key={s} disabled={changingStatus || placement.status === s} onClick={() => handleStatusChange(s)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize transition-colors disabled:opacity-50 ${
                  placement.status === s ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-3 border-b border-slate-100 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Actions</p>
          <SidebarAction icon={<Edit2 size={13} />} label="Edit Placement" onClick={() => setShowEdit(true)} />
          <SidebarAction icon={<Calendar size={13} />} label="Request Extension" onClick={() => setShowExtension(true)} disabled={!isActive} />
          <SidebarAction icon={<ClipboardList size={13} />} label="Move-in Report" onClick={() => setShowCondition('move_in')} />
          <SidebarAction icon={<ClipboardList size={13} />} label="Move-out Report" onClick={() => setShowCondition('move_out')} />
          <SidebarAction icon={<Wrench size={13} />} label="Log Maintenance" onClick={() => setShowMaintenance(true)} disabled={!unit} />
          <SidebarAction icon={<LogOut size={13} />} label="Discharge" onClick={() => setShowDischarge(true)} disabled={!isActive} danger />
        </div>

        <nav className="px-3 py-3 space-y-0.5 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Sections</p>
          {sections.map(s => <NavItem key={s.id} id={s.id} label={s.label} active={activeSection} onNav={scrollTo} />)}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 xl:p-8">
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm divide-y divide-gray-100/80 overflow-hidden">

          <div id="sec-overview" className="px-8 py-6">
            <p className="section-label">Overview</p>
            <ALEBar placement={placement} />
            <div className="grid grid-cols-3 gap-6 mt-5">
              <div>
                <p className="text-xs text-gray-400 mb-1">Daily Limit</p>
                <p className="text-sm font-semibold text-gray-800">{placement.ale_daily_limit ? `$${Number(placement.ale_daily_limit).toLocaleString()}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Cap</p>
                <p className="text-sm font-semibold text-gray-800">{placement.ale_total_cap ? `$${Number(placement.ale_total_cap).toLocaleString()}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">ALE Expiry</p>
                <p className="text-sm font-semibold text-gray-800">{fmt(placement.ale_expiry_date)}</p>
              </div>
            </div>
          </div>

          <div id="sec-policyholder" className="px-8 py-6">
            <p className="section-label">Policyholder</p>
            <InfoRow label="Name" value={ph?.name} />
            <InfoRow label="Email" value={ph?.email} />
            <InfoRow label="Phone" value={ph?.phone} />
            <InfoRow label="Household" value={ph?.household_size ? `${ph.household_size} occupants` : null} />
            <InfoRow label="Pets" value={ph?.pets ? `Yes — ${ph.pet_details || ''}` : null} />
            <InfoRow label="Accessibility" value={ph?.accessibility_needs} />
            <ContactLinks phone={ph?.phone} email={ph?.email} id={ph?.id} navigate={navigate} />
          </div>

          <div id="sec-claim" className="px-8 py-6">
            <p className="section-label">Claim Details</p>
            <InfoRow label="Claim #" value={placement.claim_number} />
            <InfoRow label="Carrier" value={placement.carrier_name} />
            <InfoRow label="Move-in" value={fmt(placement.move_in_date)} />
            <InfoRow label="Move-out" value={fmt(placement.move_out_date)} />
            {placement.dropbox_link && (
              <a href={placement.dropbox_link} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline mt-4">
                <ExternalLink size={12} /> Dropbox Folder
              </a>
            )}
          </div>

          {adj && (
            <div id="sec-adjuster" className="px-8 py-6">
              <p className="section-label">Adjuster</p>
              <InfoRow label="Name" value={adj.name} />
              <InfoRow label="Carrier" value={adj.carrier} />
              <InfoRow label="Phone" value={adj.phone} />
              <InfoRow label="Email" value={adj.email} />
              <ContactLinks phone={adj.phone} email={adj.email} id={adj.id} navigate={navigate} />
            </div>
          )}

          {unit && (
            <div id="sec-unit" className="px-8 py-6">
              <p className="section-label">Housing Unit</p>
              <InfoRow label="Unit ID" value={unit.unit_id} />
              <InfoRow label="Property" value={unit.property_name} />
              <InfoRow label="Address" value={unit.address} />
              <InfoRow label="City" value={`${unit.city}, ${unit.state} ${unit.zip}`} />
              <InfoRow label="Bedrooms" value={unit.bedrooms ? `${unit.bedrooms} bd / ${unit.bathrooms} ba` : null} />
              <button onClick={() => navigate(`/inventory/${unit.id}`)}
                className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline mt-4">
                <ExternalLink size={12} /> View Unit Details
              </button>
            </div>
          )}

          <div id="sec-checklist" className="px-8 py-6">
            <p className="section-label">Move-in Checklist</p>
            <MoveInChecklist checklists={checklists} onToggle={toggleChecklistItem} />
          </div>

          <div id="sec-conditions" className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label mb-0">Condition Reports</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCondition('move_in')} className="text-xs text-navy hover:underline">+ Move-in</button>
                <button onClick={() => setShowCondition('move_out')} className="text-xs text-navy hover:underline">+ Move-out</button>
              </div>
            </div>
            {conditionReports.length === 0 ? (
              <p className="text-sm text-gray-400">No condition reports yet.</p>
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

          <div id="sec-maintenance" className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label mb-0">Maintenance</p>
              {unit && <button onClick={() => setShowMaintenance(true)} className="text-xs text-navy hover:underline">+ Log Request</button>}
            </div>
            {maintenanceRequests.length === 0 ? (
              <p className="text-sm text-gray-400">No maintenance requests.</p>
            ) : maintenanceRequests.map(r => (
              <div key={r.id} className="py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-700 flex-1">{r.description}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${URGENCY_COLORS[r.urgency] || 'bg-gray-100 text-gray-500'}`}>{r.urgency}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs capitalize ${r.status === 'resolved' ? 'text-green-600' : r.status === 'in_progress' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                  {r.vendor && <span className="text-xs text-gray-400">{r.vendor.company_name || r.vendor.name}</span>}
                  <span className="text-xs text-gray-400">{fmt(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          <div id="sec-invoices" className="px-8 py-6">
            <p className="section-label">Invoices</p>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No invoices yet.</p>
            ) : invoices.map(inv => (
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
          </div>

          <div id="sec-documents" className="px-8 py-6">
            <p className="section-label">Documents</p>
            <DocumentsSection entityType="placement" entityId={placement.id} />
          </div>

          <div id="sec-notes" className="px-8 py-6">
            <p className="section-label">Notes</p>
            <NotesLog notes={notes} onAdd={addNote} />
          </div>

          <div id="sec-activity" className="px-8 py-6">
            <p className="section-label">Activity Timeline</p>
            <ActivityTimeline activity={activity} />
          </div>

        </div>
      </div>

      {showEdit && <EditPlacementPanel placement={placement} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); refetch() }} />}
      {showDischarge && <DischargePanel placement={placement} onClose={() => setShowDischarge(false)} onSaved={() => { setShowDischarge(false); refetch() }} />}
      {showExtension && <ExtensionRequestPanel placement={placement} onClose={() => setShowExtension(false)} onSaved={() => { setShowExtension(false); refetch() }} />}
      {showCondition && <ConditionReportPanel placement={placement} reportType={showCondition} onClose={() => setShowCondition(null)} onSaved={() => { setShowCondition(null); refreshExtra() }} />}
      {showMaintenance && <MaintenanceRequestPanel unit={unit} placement={placement} onClose={() => setShowMaintenance(false)} onSaved={() => { setShowMaintenance(false); refreshExtra() }} />}
    </div>
  )
}
