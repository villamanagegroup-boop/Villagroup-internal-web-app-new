import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useContactDetail(id) {
  const [contact, setContact] = useState(null)
  const [related, setRelated] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    if (!id) return
    setLoading(true)
    setError(null)

    const { data: c, error: cErr } = await supabase
      .from('contacts')
      .select('*, tpa:tpa_id(id, name, company_name, phone, email)')
      .eq('id', id)
      .single()

    if (cErr) { setError(cErr.message); setLoading(false); return }
    setContact(c)

    const extras = {}

    if (c.type === 'adjuster') {
      // Placement history for this adjuster
      const { data } = await supabase
        .from('placements')
        .select('id, claim_number, carrier_name, status, move_in_date, move_out_date, policyholder:policyholder_id(name)')
        .eq('adjuster_id', id)
        .order('move_in_date', { ascending: false })
      extras.placements = data || []
    }

    if (c.type === 'tpa') {
      // Adjusters under this TPA
      const { data: adjs } = await supabase
        .from('contacts')
        .select('id, name, phone, email, carrier')
        .eq('tpa_id', id)
        .eq('type', 'adjuster')

      // All placements via adjusters in this TPA
      const adjIds = (adjs || []).map(a => a.id)
      let placements = []
      if (adjIds.length > 0) {
        const { data: pls } = await supabase
          .from('placements')
          .select('id, claim_number, carrier_name, status, move_in_date, move_out_date, policyholder:policyholder_id(name), adjuster:adjuster_id(name)')
          .in('adjuster_id', adjIds)
          .order('move_in_date', { ascending: false })
        placements = pls || []
      }
      extras.adjusters = adjs || []
      extras.placements = placements
    }

    if (c.type === 'vendor' || c.type === 'property_owner') {
      const { data: units } = await supabase
        .from('units')
        .select('id, unit_id, property_name, city, state, status')
        .eq('vendor_id', id)
        .order('created_at', { ascending: false })
      extras.units = units || []

      // Revenue via placements on those units
      const unitIds = (units || []).map(u => u.id)
      if (unitIds.length > 0) {
        const { data: pls } = await supabase
          .from('placements')
          .select('id, claim_number, status, move_in_date, move_out_date, policyholder:policyholder_id(name)')
          .in('unit_id', unitIds)
          .order('move_in_date', { ascending: false })
        extras.placements = pls || []

        const placementIds = (pls || []).map(p => p.id)
        if (placementIds.length > 0) {
          const { data: invs } = await supabase
            .from('invoices')
            .select('id, invoice_number, total, status, placement_id')
            .in('placement_id', placementIds)
          extras.invoices = invs || []
        }
      }
    }

    if (c.type === 'policyholder') {
      const { data: pls } = await supabase
        .from('placements')
        .select('id, claim_number, carrier_name, status, move_in_date, move_out_date, unit:unit_id(unit_id, property_name, city, state), adjuster:adjuster_id(name, carrier)')
        .eq('policyholder_id', id)
        .order('move_in_date', { ascending: false })
      extras.placements = pls || []
    }

    setRelated(extras)
    setLoading(false)
  }

  async function updateLastContact() {
    await supabase
      .from('contacts')
      .update({ last_contact_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)
    fetch()
  }

  async function updateField(field, value) {
    const { error } = await supabase.from('contacts').update({ [field]: value }).eq('id', id)
    if (!error) fetch()
    return error
  }

  useEffect(() => { fetch() }, [id])

  return { contact, related, loading, error, updateLastContact, updateField, refetch: fetch }
}
