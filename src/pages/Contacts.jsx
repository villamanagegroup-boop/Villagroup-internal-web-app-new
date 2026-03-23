import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, Star, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useContacts } from '../hooks/useContacts'
import NewContactModal from '../components/contacts/NewContactModal'

const TABS = [
  { id: 'clients',   label: 'Clients',               types: ['policyholder'] },
  { id: 'adjusters', label: 'Adjusters',             types: ['adjuster'] },
  { id: 'tpa',       label: 'TPAs',                  types: ['tpa'] },
  { id: 'partners',  label: 'Partners & Referrals',  types: ['partner'] },
  { id: 'owners',    label: 'Property Owners/Hosts', types: ['property_owner'] },
  { id: 'vendors',   label: 'Vendors',               types: ['vendor'] },
  { id: 'leads',     label: 'Leads / Outreach',      types: ['lead'] },
]

const RESPONSE_STYLES = {
  contacted:      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  responded:      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'no response':  'bg-gray-100 text-gray-500',
  'not interested':'bg-red-50 text-red-600 ring-1 ring-red-200',
  'follow up':    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
}

function fmtDate(d) {
  try { return d ? format(parseISO(d), 'MM/dd/yy') : '—' } catch { return '—' }
}

function SortableTh({ children, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <th
      onClick={() => onSort(field)}
      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active
          ? (sort.dir === 'asc' ? <ChevronUp size={11} className="text-navy" /> : <ChevronDown size={11} className="text-navy" />)
          : <ChevronsUpDown size={11} className="opacity-25" />}
      </span>
    </th>
  )
}

function Th({ children }) {
  return <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{children}</th>
}

function sortList(list, sort) {
  if (!sort.field) return list
  return [...list].sort((a, b) => {
    let aVal = a[sort.field] ?? ''
    let bVal = b[sort.field] ?? ''
    if (typeof aVal === 'number' || typeof bVal === 'number') {
      return sort.dir === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    }
    if (sort.field.includes('date')) {
      aVal = aVal ? new Date(aVal) : new Date(sort.dir === 'asc' ? 9e15 : 0)
      bVal = bVal ? new Date(bVal) : new Date(sort.dir === 'asc' ? 9e15 : 0)
      return sort.dir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return sort.dir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })
}

const colCount = { clients: 7, adjusters: 7, tpa: 7, partners: 8, owners: 8, vendors: 8, leads: 8 }

export default function Contacts() {
  const [activeTab, setActiveTab] = useState('clients')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' })
  const [showPanel, setShowPanel] = useState(false)
  const navigate = useNavigate()

  const tab = TABS.find(t => t.id === activeTab)
  const { contacts, loading, error, refetch } = useContacts(tab.types)

  useEffect(() => {
    setSort({ field: 'name', dir: 'asc' })
    setSearch('')
  }, [activeTab])

  function toggleSort(field) {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const filtered = useMemo(() => {
    let list = contacts
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.company_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.contact_category?.toLowerCase().includes(q) ||
        c.contact_ref_id?.toLowerCase().includes(q)
      )
    }
    return sortList(list, sort)
  }, [contacts, search, sort])

  const s = { sort, onSort: toggleSort }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{contacts.length} {tab.label.toLowerCase()}</p>
        </div>
        <button onClick={() => setShowPanel(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-navy to-navy-500 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 transition-all">
          <Plus size={15} />
          <span className="hidden sm:inline">New Contact</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar space-y-2">
        <div className="flex items-center gap-2">
          <div className="overflow-x-auto scrollbar-none flex-1">
            <div className="flex items-center gap-0.5 min-w-max">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === t.id ? 'bg-navy/8 text-navy' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/80'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {error && <span className="text-xs text-red-600">{error} <button onClick={refetch} className="underline">Retry</button></span>}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${tab.label.toLowerCase()}...`}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200/80 rounded-lg bg-white/70 focus:outline-none focus:ring-2 focus:ring-navy/30 w-56" />
            </div>
          </div>
        </div>
        {/* Mobile search */}
        <div className="md:hidden relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab.label.toLowerCase()}...`}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200/80 rounded-lg bg-white/70 focus:outline-none focus:ring-2 focus:ring-navy/30" />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex-1 overflow-auto p-4 space-y-2">
        {loading
          ? Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)
          : filtered.length === 0
          ? <p className="text-center text-sm text-gray-400 py-12">{search ? 'No contacts match your search.' : `No ${tab.label.toLowerCase()} yet.`}</p>
          : filtered.map(c => (
            <div key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer active:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.name || c.company_name || '—'}</p>
                  {c.company_name && c.name && <p className="text-xs text-gray-400 truncate">{c.company_name}</p>}
                </div>
                {c.contact_category && (
                  <span className="px-2 py-0.5 rounded-md bg-navy/8 text-navy text-xs font-medium shrink-0 capitalize">
                    {c.contact_category.length > 18 ? c.contact_category.slice(0, 18) + '…' : c.contact_category}
                  </span>
                )}
              </div>
              {(c.phone || c.email) && (
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
                  {c.phone && <span>{c.phone}</span>}
                  {c.phone && c.email && <span className="text-gray-300">·</span>}
                  {c.email && <span className="truncate">{c.email}</span>}
                </div>
              )}
            </div>
          ))
        }
      </div>

      {/* Desktop table */}
      <div className="hidden md:block flex-1 overflow-auto p-6">
        <div className="table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-sky-50/40">
                {activeTab === 'clients'   && <ClientHeaders {...s} />}
                {activeTab === 'adjusters' && <AdjusterHeaders {...s} />}
                {activeTab === 'tpa'       && <TPAHeaders {...s} />}
                {activeTab === 'partners'  && <PartnerHeaders {...s} />}
                {activeTab === 'owners'    && <OwnerHeaders {...s} />}
                {activeTab === 'vendors'   && <VendorHeaders {...s} />}
                {activeTab === 'leads'     && <LeadHeaders {...s} />}
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(colCount[activeTab] - 1).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100/80 rounded animate-pulse" /></td>
                      ))}
                      <td />
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={colCount[activeTab]} className="px-4 py-12 text-center text-sm text-gray-400">
                      {search ? 'No contacts match your search.' : `No ${tab.label.toLowerCase()} yet.`}
                    </td>
                  </tr>
                )
                : filtered.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
                    className="hover:bg-sky-50/30 cursor-pointer group transition-colors">
                    {activeTab === 'clients'   && <ClientRow c={c} />}
                    {activeTab === 'adjusters' && <AdjusterRow c={c} />}
                    {activeTab === 'tpa'       && <TPARow c={c} />}
                    {activeTab === 'partners'  && <PartnerRow c={c} />}
                    {activeTab === 'owners'    && <OwnerRow c={c} />}
                    {activeTab === 'vendors'   && <VendorRow c={c} />}
                    {activeTab === 'leads'     && <LeadRow c={c} fmtDate={fmtDate} statusStyles={RESPONSE_STYLES} />}
                    <td className="px-4 py-3 text-gray-300 group-hover:text-gray-400"><ChevronRight size={16} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showPanel && (
        <NewContactModal
          defaultTab={activeTab}
          onClose={() => setShowPanel(false)}
          onCreated={c => { setShowPanel(false); navigate(`/contacts/${c.id}`) }}
        />
      )}
    </div>
  )
}

/* ── Shared cell helpers ── */
function Td({ children }) {
  return <td className="px-4 py-3 text-gray-500">{children || '—'}</td>
}
function RefId({ value }) {
  return <td className="px-4 py-3 font-mono text-xs text-gray-400">{value || '—'}</td>
}
function PrimaryName({ value }) {
  return <td className="px-4 py-3 font-medium text-gray-900">{value || '—'}</td>
}

/* ── Adjusters ── */
function AdjusterHeaders({ sort, onSort }) {
  const s = { sort, onSort }
  return <>
    <Th>Adjuster ID</Th>
    <SortableTh field="name" {...s}>Name</SortableTh>
    <SortableTh field="carrier" {...s}>Carrier</SortableTh>
    <SortableTh field="city" {...s}>City</SortableTh>
    <Th>Phone</Th>
    <Th>Email</Th>
  </>
}
function AdjusterRow({ c }) {
  return <>
    <RefId value={c.contact_ref_id} />
    <PrimaryName value={c.name} />
    <Td>{c.carrier}</Td>
    <Td>{c.city}</Td>
    <Td>{c.phone}</Td>
    <Td>{c.email}</Td>
  </>
}

/* ── TPAs ── */
function TPAHeaders({ sort, onSort }) {
  const s = { sort, onSort }
  return <>
    <Th>TPA ID</Th>
    <SortableTh field="company_name" {...s}>Company</SortableTh>
    <SortableTh field="name" {...s}>Contact Name</SortableTh>
    <SortableTh field="city" {...s}>City</SortableTh>
    <Th>Phone</Th>
    <Th>Email</Th>
  </>
}
function TPARow({ c }) {
  return <>
    <RefId value={c.contact_ref_id} />
    <PrimaryName value={c.company_name || c.name} />
    <Td>{c.name}</Td>
    <Td>{c.city}</Td>
    <Td>{c.phone}</Td>
    <Td>{c.email}</Td>
  </>
}

/* ── Clients ── */
function ClientHeaders({ sort, onSort }) {
  const s = { sort, onSort }
  return <>
    <Th>Client ID</Th>
    <SortableTh field="name" {...s}>Family / Client Name</SortableTh>
    <Th>Phone</Th>
    <Th>Email</Th>
    <SortableTh field="num_adults" {...s}>Adults</SortableTh>
    <SortableTh field="num_children" {...s}>Children</SortableTh>
  </>
}
function ClientRow({ c }) {
  return <>
    <RefId value={c.contact_ref_id} />
    <PrimaryName value={c.name} />
    <Td>{c.phone}</Td>
    <Td>{c.email}</Td>
    <Td>{c.num_adults}</Td>
    <Td>{c.num_children}</Td>
  </>
}

/* ── Partners & Referrals ── */
function PartnerHeaders({ sort, onSort }) {
  const s = { sort, onSort }
  return <>
    <Th>Partner ID</Th>
    <SortableTh field="company_name" {...s}>Company</SortableTh>
    <SortableTh field="name" {...s}>Contact Name</SortableTh>
    <SortableTh field="contact_category" {...s}>Category</SortableTh>
    <SortableTh field="city" {...s}>City</SortableTh>
    <Th>Phone</Th>
    <Th>Email</Th>
  </>
}
function PartnerRow({ c }) {
  return <>
    <RefId value={c.contact_ref_id} />
    <PrimaryName value={c.company_name} />
    <Td>{c.name}</Td>
    <Td>{c.contact_category}</Td>
    <Td>{c.city}</Td>
    <Td>{c.phone}</Td>
    <Td>{c.email}</Td>
  </>
}

/* ── Property Owners/Hosts ── */
function OwnerHeaders({ sort, onSort }) {
  const s = { sort, onSort }
  return <>
    <Th>Owner ID</Th>
    <SortableTh field="name" {...s}>Owner Name</SortableTh>
    <SortableTh field="contact_category" {...s}>Category</SortableTh>
    <SortableTh field="city" {...s}>City</SortableTh>
    <SortableTh field="num_properties" {...s}>Properties</SortableTh>
    <SortableTh field="active_listings" {...s}>Active Listings</SortableTh>
    <Th>Phone</Th>
  </>
}
function OwnerRow({ c }) {
  return <>
    <RefId value={c.contact_ref_id} />
    <PrimaryName value={c.name} />
    <Td>{c.contact_category}</Td>
    <Td>{c.city}</Td>
    <Td>{c.num_properties}</Td>
    <Td>{c.active_listings}</Td>
    <Td>{c.phone}</Td>
  </>
}

/* ── Vendors ── */
function VendorHeaders({ sort, onSort }) {
  const s = { sort, onSort }
  return <>
    <Th>Vendor ID</Th>
    <SortableTh field="company_name" {...s}>Vendor Name</SortableTh>
    <SortableTh field="contact_category" {...s}>Service Type</SortableTh>
    <SortableTh field="city" {...s}>City</SortableTh>
    <Th>Phone</Th>
    <Th>Email</Th>
    <Th>Preferred</Th>
  </>
}
function VendorRow({ c }) {
  return <>
    <RefId value={c.contact_ref_id} />
    <PrimaryName value={c.company_name || c.name} />
    <Td>{c.service_type || c.contact_category}</Td>
    <Td>{c.city}</Td>
    <Td>{c.phone}</Td>
    <Td>{c.email}</Td>
    <td className="px-4 py-3">
      {c.preferred_vendor
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <Star size={10} className="fill-amber-500" /> Preferred
          </span>
        : <span className="text-gray-300">—</span>}
    </td>
  </>
}

/* ── Leads / Outreach ── */
function LeadHeaders({ sort, onSort }) {
  const s = { sort, onSort }
  return <>
    <Th>Lead ID</Th>
    <SortableTh field="name" {...s}>Contact Name</SortableTh>
    <SortableTh field="company_name" {...s}>Company</SortableTh>
    <SortableTh field="contact_category" {...s}>Category</SortableTh>
    <SortableTh field="city" {...s}>City</SortableTh>
    <SortableTh field="date_contacted" {...s}>Date Contacted</SortableTh>
    <SortableTh field="response_status" {...s}>Status</SortableTh>
  </>
}
function LeadRow({ c, fmtDate, statusStyles }) {
  const style = statusStyles[c.response_status?.toLowerCase()] || 'bg-gray-100 text-gray-500'
  return <>
    <RefId value={c.contact_ref_id} />
    <PrimaryName value={c.name} />
    <Td>{c.company_name}</Td>
    <Td>{c.contact_category}</Td>
    <Td>{c.city}</Td>
    <td className="px-4 py-3 text-gray-500 tabular-nums">{fmtDate(c.date_contacted)}</td>
    <td className="px-4 py-3">
      {c.response_status
        ? <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${style}`}>{c.response_status}</span>
        : <span className="text-gray-300">—</span>}
    </td>
  </>
}
