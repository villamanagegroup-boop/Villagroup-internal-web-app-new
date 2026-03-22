import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns'

export function useBilling() {
  const [invoices, setInvoices] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        placement:placement_id (
          id, claim_number, carrier_name,
          policyholder:policyholder_id (name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) { setError(error.message); setLoading(false); return }

    const all = data || []
    setInvoices(all)

    // Compute summary
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    let billedThisMonth = 0
    let collectedThisMonth = 0
    let outstanding = 0
    let oldestUnpaid = null

    all.forEach(inv => {
      const total = Number(inv.total || 0)
      const created = inv.created_at ? parseISO(inv.created_at) : null
      const inMonth = created && isValid(created) && created >= monthStart && created <= monthEnd

      if (inMonth) billedThisMonth += total
      if (inv.status === 'paid') {
        const paid = inv.date_paid ? parseISO(inv.date_paid) : null
        if (paid && isValid(paid) && paid >= monthStart && paid <= monthEnd) {
          collectedThisMonth += total
        }
      }
      if (['sent', 'overdue', 'draft'].includes(inv.status)) {
        outstanding += total
        if (!oldestUnpaid || (inv.due_date && parseISO(inv.due_date) < parseISO(oldestUnpaid.due_date || '9999'))) {
          oldestUnpaid = inv
        }
      }
    })

    setSummary({ billedThisMonth, collectedThisMonth, outstanding, oldestUnpaid })
    setLoading(false)
  }

  async function markPaid(id) {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid', date_paid: new Date().toISOString().split('T')[0] })
      .eq('id', id)

    if (!error) {
      await supabase.from('activity_log').insert({
        entity_type: 'invoice', entity_id: id,
        action: 'invoice_paid', description: 'Invoice marked as paid',
      })
      fetch()
    }
    return error
  }

  useEffect(() => {
    fetch()
    const sub = supabase
      .channel('billing-invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  return { invoices, summary, loading, error, refetch: fetch, markPaid }
}
