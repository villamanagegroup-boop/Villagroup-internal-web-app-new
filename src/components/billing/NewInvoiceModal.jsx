import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import SlidePanel from '../ui/SlidePanel'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { value: 'housing_per_diem', label: 'Housing Per Diem' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'management_fee', label: 'Management Fee' },
  { value: 'other', label: 'Other' },
]

const EMPTY_ITEM = { description: '', category: 'housing_per_diem', quantity: '1', unit_price: '' }

export default function NewInvoiceModal({ onClose, onCreated }) {
  const [placementId, setPlacementId] = useState('')
  const [carrierTpa, setCarrierTpa] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [placements, setPlacements] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [invoiceNum, setInvoiceNum] = useState('')

  useEffect(() => {
    supabase
      .from('placements')
      .select('id, claim_number, carrier_name, policyholder:policyholder_id(name)')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPlacements(data || [])
        // Auto-generate invoice number
        setInvoiceNum(`INV-${Date.now().toString().slice(-6)}`)
      })
  }, [])

  function setItem(i, field, value) {
    setItems(items => items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(items => [...items, { ...EMPTY_ITEM }])
  }

  function removeItem(i) {
    setItems(items => items.filter((_, idx) => idx !== i))
  }

  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  async function handleSubmit() {
    if (!placementId) { setError('Please select a placement.'); return }
    if (items.some(i => !i.description || !i.unit_price)) {
      setError('All line items need a description and price.'); return
    }
    setSaving(true)
    setError(null)

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .insert({
        placement_id: placementId,
        invoice_number: invoiceNum,
        carrier_tpa_name: carrierTpa || null,
        status: 'draft',
        total,
        due_date: dueDate || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (invErr) { setError(invErr.message); setSaving(false); return }

    await supabase.from('invoice_line_items').insert(
      items.map(item => ({
        invoice_id: inv.id,
        description: item.description,
        category: item.category,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price),
      }))
    )

    await supabase.from('activity_log').insert({
      entity_type: 'invoice', entity_id: inv.id,
      action: 'created', description: `Invoice ${invoiceNum} created — $${total.toLocaleString()}`,
    })

    setSaving(false)
    onCreated(inv)
  }

  const footer = (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Invoice Total</span>
        <span className="text-xl font-bold text-navy">${total.toLocaleString()}</span>
      </div>
      <button onClick={handleSubmit} disabled={saving}
        className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm disabled:opacity-60 hover:bg-navy-700 transition-colors">
        {saving ? 'Creating...' : 'Create Invoice'}
      </button>
    </div>
  )

  return (
    <SlidePanel onClose={onClose} title="New Invoice" footer={footer}>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Field label="Invoice #" value={invoiceNum} onChange={setInvoiceNum} />

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Placement *</label>
        <select value={placementId} onChange={e => {
          setPlacementId(e.target.value)
          const pl = placements.find(p => p.id === e.target.value)
          if (pl) setCarrierTpa(pl.carrier_name)
        }} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30">
          <option value="">— Select placement —</option>
          {placements.map(p => (
            <option key={p.id} value={p.id}>{p.policyholder?.name} — #{p.claim_number}</option>
          ))}
        </select>
      </div>

      <Field label="Carrier / TPA Being Billed" value={carrierTpa} onChange={setCarrierTpa} />
      <Field label="Due Date" value={dueDate} onChange={setDueDate} type="date" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Line Items</label>
          <button onClick={addItem} className="flex items-center gap-1 text-navy text-xs font-medium hover:text-navy-700">
            <Plus size={13} /> Add Item
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
              <div className="flex gap-2">
                <input type="text" value={item.description} onChange={e => setItem(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30" />
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select value={item.category} onChange={e => setItem(i, 'category', e.target.value)}
                  className="col-span-3 sm:col-span-1 text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input type="number" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)}
                  placeholder="Qty" className="text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30" />
                <input type="number" value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)}
                  placeholder="Unit price" className="text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy/30" />
              </div>
              {item.unit_price && (
                <p className="text-xs text-right text-gray-400">= ${((Number(item.quantity) || 1) * Number(item.unit_price)).toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Field label="Notes" value={notes} onChange={setNotes} />
    </SlidePanel>
  )
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
