import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, CheckCircle, Send, Trash2, Plus, Phone, Mail, ExternalLink } from 'lucide-react'
import { useInvoiceDetail } from '../hooks/useInvoiceDetail'
import InvoiceStatusBadge from '../components/billing/InvoiceStatusBadge'

const CATEGORIES = {
  housing_per_diem: 'Housing Per Diem',
  utilities: 'Utilities',
  management_fee: 'Management Fee',
  other: 'Other',
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

function SidebarAction({ icon, label, onClick, disabled, variant = 'default' }) {
  const styles = {
    default: 'text-gray-600 hover:bg-slate-100 hover:text-gray-800',
    primary: 'text-navy hover:bg-navy/8',
    success: 'text-green-600 hover:bg-green-50',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}>
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

const EMPTY_ITEM = { description: '', category: 'housing_per_diem', quantity: '1', unit_price: '' }

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoice, lineItems, loading, error, addLineItem, deleteLineItem, updateInvoice, markPaid, markSent, refetch } = useInvoiceDetail(id)

  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM })
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [activeSection, setActiveSection] = useState('sec-summary')

  async function handleAddItem() {
    if (!newItem.description || !newItem.unit_price) return
    setSaving(true)
    await addLineItem(newItem)
    setNewItem({ ...EMPTY_ITEM })
    setAddingItem(false)
    setSaving(false)
  }

  async function handleMarkPaid() {
    setActionLoading('paid')
    await markPaid()
    setActionLoading(null)
  }

  async function handleMarkSent() {
    setActionLoading('sent')
    await markSent()
    setActionLoading(null)
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(id)
  }

  useEffect(() => {
    if (!invoice) return
    const els = document.querySelectorAll('[id^="sec-"]')
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) }) },
      { rootMargin: '-10% 0px -85% 0px', threshold: 0 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [invoice])

  if (loading) {
    return (
      <div className="flex min-h-full animate-pulse">
        <div className="w-52 shrink-0 h-screen bg-white/40 border-r border-slate-200/40" />
        <div className="flex-1 p-8"><div className="max-w-3xl bg-white/50 rounded-xl h-[600px]" /></div>
      </div>
    )
  }

  if (error || !invoice) {
    return <div className="p-6 text-red-600 text-sm">{error || 'Invoice not found.'}</div>
  }

  const ph = invoice.placement?.policyholder
  const adj = invoice.placement?.adjuster

  const sections = [
    { id: 'sec-summary', label: 'Summary' },
    { id: 'sec-items', label: 'Line Items' },
    { id: 'sec-placement', label: 'Placement' },
    ...(invoice.notes ? [{ id: 'sec-notes', label: 'Notes' }] : []),
  ]

  return (
    <div className="flex min-h-full">
      {/* Detail Sidebar */}
      <aside className="w-52 shrink-0 sticky top-0 h-screen overflow-y-auto bg-white/50 backdrop-blur-sm border-r border-slate-200/40 flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <button onClick={() => navigate('/billing')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <ArrowLeft size={13} /> Billing
          </button>
          <h2 className="font-display font-semibold text-navy text-[15px] leading-snug">
            {invoice.invoice_number ?? 'Invoice'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{ph?.name}</p>
          <div className="mt-2.5"><InvoiceStatusBadge status={invoice.status} /></div>
        </div>

        <div className="px-4 py-4 border-b border-slate-100">
          <p className="text-3xl font-bold text-navy tabular-nums">${Number(invoice.total || 0).toLocaleString()}</p>
          <div className="mt-1.5 space-y-0.5">
            {invoice.due_date && <p className="text-xs text-gray-400">Due {fmt(invoice.due_date)}</p>}
            {invoice.date_sent && <p className="text-xs text-gray-400">Sent {fmt(invoice.date_sent)}</p>}
            {invoice.date_paid && <p className="text-xs text-green-600 font-medium">Paid {fmt(invoice.date_paid)}</p>}
          </div>
        </div>

        <div className="px-3 py-3 border-b border-slate-100 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Actions</p>
          {invoice.status === 'draft' && (
            <SidebarAction icon={<Send size={13} />} label={actionLoading === 'sent' ? 'Marking...' : 'Mark Sent'} onClick={handleMarkSent} disabled={!!actionLoading} variant="primary" />
          )}
          {invoice.status !== 'paid' && (
            <SidebarAction icon={<CheckCircle size={13} />} label={actionLoading === 'paid' ? 'Marking...' : 'Mark Paid'} onClick={handleMarkPaid} disabled={!!actionLoading} variant="success" />
          )}
          {invoice.status === 'paid' && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-600">
              <CheckCircle size={13} /> Paid {fmt(invoice.date_paid)}
            </div>
          )}
        </div>

        <nav className="px-3 py-3 space-y-0.5 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-300 px-3 mb-1.5">Sections</p>
          {sections.map(s => <NavItem key={s.id} id={s.id} label={s.label} active={activeSection} onNav={scrollTo} />)}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 xl:p-8">
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm divide-y divide-gray-100/80 overflow-hidden">

          <div id="sec-summary" className="px-8 py-6">
            <p className="section-label">Summary</p>
            <InfoRow label="Invoice #" value={invoice.invoice_number} />
            <InfoRow label="Billed To" value={invoice.carrier_tpa_name} />
            <InfoRow label="Total" value={`$${Number(invoice.total || 0).toLocaleString()}`} />
            <InfoRow label="Status" value={invoice.status} />
            <InfoRow label="Due Date" value={fmt(invoice.due_date)} />
            <InfoRow label="Date Sent" value={invoice.date_sent ? fmt(invoice.date_sent) : null} />
            <InfoRow label="Date Paid" value={invoice.date_paid ? fmt(invoice.date_paid) : null} />
          </div>

          <div id="sec-items" className="px-8 py-6">
            <p className="section-label">Line Items</p>

            {lineItems.length === 0 && !addingItem && (
              <p className="text-sm text-gray-400 mb-4">No line items yet.</p>
            )}

            {lineItems.map(item => (
              <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.description}</p>
                  <p className="text-xs text-gray-400">{CATEGORIES[item.category] ?? item.category} · {item.quantity} × ${Number(item.unit_price).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-semibold text-gray-800 tabular-nums">${Number(item.total).toLocaleString()}</p>
                  {invoice.status !== 'paid' && (
                    <button onClick={() => deleteLineItem(item.id)} className="p-1 text-red-300 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {lineItems.length > 0 && (
              <div className="flex items-center justify-between py-3 border-t border-gray-200 font-semibold">
                <span className="text-sm text-gray-700">Total</span>
                <span className="text-base text-navy tabular-nums">${Number(invoice.total || 0).toLocaleString()}</span>
              </div>
            )}

            {invoice.status !== 'paid' && (
              addingItem ? (
                <div className="mt-4 bg-slate-50/80 rounded-xl p-4 space-y-3">
                  <input type="text" value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))}
                    placeholder="Description" autoFocus
                    className="w-full text-sm border border-gray-200/80 rounded-lg px-3 py-2 bg-white/80 focus:outline-none focus:ring-2 focus:ring-navy/30" />
                  <div className="grid grid-cols-3 gap-2">
                    <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                      className="text-xs border border-gray-200/80 rounded-lg px-2 py-2 bg-white/80 focus:outline-none">
                      {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="number" value={newItem.quantity} onChange={e => setNewItem(n => ({ ...n, quantity: e.target.value }))}
                      placeholder="Qty" className="text-sm border border-gray-200/80 rounded-lg px-3 py-2 bg-white/80 focus:outline-none" />
                    <input type="number" value={newItem.unit_price} onChange={e => setNewItem(n => ({ ...n, unit_price: e.target.value }))}
                      placeholder="Price" className="text-sm border border-gray-200/80 rounded-lg px-3 py-2 bg-white/80 focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddItem} disabled={saving} className="flex-1 py-2 bg-gradient-to-r from-navy to-navy-500 text-white rounded-lg text-sm font-medium">
                      {saving ? '...' : 'Add Item'}
                    </button>
                    <button onClick={() => setAddingItem(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingItem(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-navy/30 hover:text-navy transition-colors">
                  <Plus size={14} /> Add Line Item
                </button>
              )
            )}
          </div>

          <div id="sec-placement" className="px-8 py-6">
            <p className="section-label">Placement</p>
            {invoice.placement ? (
              <>
                <InfoRow label="Policyholder" value={ph?.name} />
                <InfoRow label="Claim #" value={invoice.placement.claim_number} />
                <InfoRow label="Carrier / TPA" value={invoice.carrier_tpa_name ?? invoice.placement.carrier_name} />
                <InfoRow label="Adjuster" value={adj?.name} />
                {(ph?.phone || ph?.email) && (
                  <div className="flex items-center gap-4 mt-4 pt-1">
                    {ph.phone && <a href={`tel:${ph.phone}`} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline"><Phone size={12} /> Call</a>}
                    {ph.email && <a href={`mailto:${ph.email}`} className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline"><Mail size={12} /> Email</a>}
                  </div>
                )}
                <button onClick={() => navigate(`/placements/${invoice.placement.id}`)}
                  className="flex items-center gap-1.5 text-xs text-navy font-medium hover:underline mt-4">
                  <ExternalLink size={12} /> View Placement
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400">No placement linked.</p>
            )}
          </div>

          {invoice.notes && (
            <div id="sec-notes" className="px-8 py-6">
              <p className="section-label">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
