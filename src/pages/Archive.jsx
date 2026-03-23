import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { RotateCcw, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TABS = [
  { id: 'placements', label: 'Placements' },
  { id: 'contacts',   label: 'Contacts' },
  { id: 'units',      label: 'Units' },
  { id: 'invoices',   label: 'Invoices' },
]

const TYPE_LABELS = {
  adjuster: 'Adjuster', tpa: 'TPA', vendor: 'Vendor',
  policyholder: 'Client', partner: 'Partner',
  property_owner: 'Property Owner', lead: 'Lead',
}

function fmt(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MM/dd/yy') } catch { return '—' }
}

function EmptyState({ label }) {
  return (
    <tr>
      <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
        No archived {label}.
      </td>
    </tr>
  )
}

function Th({ children }) {
  return <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{children}</th>
}

export default function Archive() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('placements')
  const [data, setData] = useState({ placements: [], contacts: [], units: [], invoices: [] })
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(null)

  const fetchTab = useCallback(async (t) => {
    setLoading(true)
    if (t === 'placements') {
      const { data: rows } = await supabase
        .from('placements')
        .select('id, claim_number, carrier_name, status, move_in_date, move_out_date, policyholder:policyholder_id(name)')
        .eq('status', 'archived')
        .order('move_in_date', { ascending: false })
      setData(d => ({ ...d, placements: rows || [] }))
    } else if (t === 'contacts') {
      const { data: rows } = await supabase
        .from('contacts')
        .select('id, name, company_name, type, email, phone, contact_ref_id')
        .eq('is_archived', true)
        .order('name')
      setData(d => ({ ...d, contacts: rows || [] }))
    } else if (t === 'units') {
      const { data: rows } = await supabase
        .from('units')
        .select('id, unit_id, property_name, city, state, status, bedrooms, bathrooms')
        .eq('is_archived', true)
        .order('property_name')
      setData(d => ({ ...d, units: rows || [] }))
    } else if (t === 'invoices') {
      const { data: rows } = await supabase
        .from('invoices')
        .select('id, invoice_number, carrier_tpa_name, total, status, due_date, created_at')
        .eq('is_archived', true)
        .order('created_at', { ascending: false })
      setData(d => ({ ...d, invoices: rows || [] }))
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTab(tab) }, [tab, fetchTab])

  async function restore(t, id) {
    setRestoring(id)
    if (t === 'placements') {
      await supabase.from('placements').update({ status: 'closed' }).eq('id', id)
    } else if (t === 'contacts') {
      await supabase.from('contacts').update({ is_archived: false }).eq('id', id)
    } else if (t === 'units') {
      await supabase.from('units').update({ is_archived: false }).eq('id', id)
    } else if (t === 'invoices') {
      await supabase.from('invoices').update({ is_archived: false }).eq('id', id)
    }
    setRestoring(null)
    fetchTab(t)
  }

  const rows = data[tab]

  return (
    <div className="flex flex-col h-full">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Archive</h1>
          <p className="text-sm text-gray-400 mt-0.5">Archived records — restore or review</p>
        </div>
      </div>

      <div className="toolbar flex items-center gap-0.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
            }`}>
            {t.label}
            {data[t.id].length > 0 && (
              <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                {data[t.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-sky-50/40">
                {tab === 'placements' && <>
                  <Th>Policyholder</Th><Th>Claim #</Th><Th>Carrier</Th><Th>Move-in</Th><Th>Move-out</Th>
                </>}
                {tab === 'contacts' && <>
                  <Th>ID</Th><Th>Name</Th><Th>Type</Th><Th>Email</Th><Th>Phone</Th>
                </>}
                {tab === 'units' && <>
                  <Th>Unit ID</Th><Th>Property</Th><Th>Location</Th><Th>Beds</Th><Th>Last Status</Th>
                </>}
                {tab === 'invoices' && <>
                  <Th>Invoice #</Th><Th>Billed To</Th><Th>Total</Th><Th>Last Status</Th><Th>Due Date</Th>
                </>}
                <th className="px-4 py-3 w-28 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {loading
                ? Array(4).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100/80 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                ? <EmptyState label={tab} />
                : rows.map(row => (
                    <tr key={row.id} className="hover:bg-sky-50/20 transition-colors">
                      {tab === 'placements' && <>
                        <td className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/placements/${row.id}`)}>
                          {row.policyholder?.name || '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.claim_number || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{row.carrier_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 tabular-nums">{fmt(row.move_in_date)}</td>
                        <td className="px-4 py-3 text-gray-500 tabular-nums">{fmt(row.move_out_date)}</td>
                      </>}
                      {tab === 'contacts' && <>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.contact_ref_id || '—'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/contacts/${row.id}`)}>
                          {row.company_name || row.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{TYPE_LABELS[row.type] || row.type}</td>
                        <td className="px-4 py-3 text-gray-500">{row.email || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{row.phone || '—'}</td>
                      </>}
                      {tab === 'units' && <>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.unit_id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/inventory/${row.id}`)}>
                          {row.property_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{row.city}, {row.state}</td>
                        <td className="px-4 py-3 text-gray-500">{row.bedrooms}bd / {row.bathrooms}ba</td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{row.status}</td>
                      </>}
                      {tab === 'invoices' && <>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700 cursor-pointer hover:underline" onClick={() => navigate(`/billing/${row.id}`)}>
                          {row.invoice_number || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.carrier_tpa_name || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">${Number(row.total || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{row.status}</td>
                        <td className="px-4 py-3 text-gray-500 tabular-nums">{fmt(row.due_date)}</td>
                      </>}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => restore(tab, row.id)}
                          disabled={restoring === row.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-navy bg-navy/8 hover:bg-navy/15 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={11} />
                          {restoring === row.id ? 'Restoring...' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {tab === 'placements' && rows.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            Restored placements will return with status "Closed".
          </p>
        )}
      </div>
    </div>
  )
}
