import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useInvoiceDetail(id) {
  const [invoice, setInvoice] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    if (!id) return
    setLoading(true)
    setError(null)

    const [{ data: inv, error: invErr }, { data: items }] = await Promise.all([
      supabase
        .from('invoices')
        .select(`
          *,
          placement:placement_id (
            id, claim_number, carrier_name, ale_running_total,
            policyholder:policyholder_id (id, name, phone, email),
            adjuster:adjuster_id (name, phone)
          )
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true }),
    ])

    if (invErr) setError(invErr.message)
    else { setInvoice(inv); setLineItems(items || []) }
    setLoading(false)
  }

  async function addLineItem(item) {
    const { error } = await supabase.from('invoice_line_items').insert({
      invoice_id: id,
      description: item.description,
      category: item.category || 'other',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price),
    })
    if (!error) {
      await recalcTotal()
      fetch()
    }
    return error
  }

  async function deleteLineItem(itemId) {
    await supabase.from('invoice_line_items').delete().eq('id', itemId)
    await recalcTotal()
    fetch()
  }

  async function recalcTotal() {
    const { data } = await supabase
      .from('invoice_line_items')
      .select('total')
      .eq('invoice_id', id)
    const newTotal = (data || []).reduce((sum, i) => sum + Number(i.total || 0), 0)
    await supabase.from('invoices').update({ total: newTotal }).eq('id', id)
  }

  async function updateInvoice(fields) {
    const { error } = await supabase.from('invoices').update(fields).eq('id', id)
    if (!error) fetch()
    return error
  }

  async function markPaid() {
    const err = await updateInvoice({ status: 'paid', date_paid: new Date().toISOString().split('T')[0] })
    if (!err) {
      await supabase.from('activity_log').insert({
        entity_type: 'invoice', entity_id: id,
        action: 'invoice_paid', description: `Invoice #${invoice?.invoice_number || id.slice(0, 8)} marked as paid`,
      })
      // Update placement running total
      if (invoice?.placement_id && invoice?.total) {
        const current = Number(invoice.placement?.ale_running_total || 0)
        await supabase.from('placements')
          .update({ ale_running_total: current + Number(invoice.total) })
          .eq('id', invoice.placement_id)
      }
    }
    return err
  }

  async function markSent() {
    return updateInvoice({ status: 'sent', date_sent: new Date().toISOString().split('T')[0] })
  }

  useEffect(() => { fetch() }, [id])

  return { invoice, lineItems, loading, error, addLineItem, deleteLineItem, updateInvoice, markPaid, markSent, refetch: fetch }
}
