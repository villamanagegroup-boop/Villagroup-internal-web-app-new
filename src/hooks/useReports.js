import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    setError(null)

    const [
      { data: placements, error: pErr },
      { data: invoices, error: iErr },
      { data: units },
    ] = await Promise.all([
      supabase.from('placements').select(`
        id, claim_number, carrier_name, status, move_in_date, move_out_date,
        ale_total_cap,
        policyholder:policyholder_id(name),
        adjuster:adjuster_id(id, name, carrier),
        unit:unit_id(id, unit_id, property_name, city, state)
      `).order('move_in_date', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('units').select('id, unit_id, property_name, city, state, status, tier'),
    ])

    if (pErr || iErr) {
      setError((pErr || iErr).message)
      setLoading(false)
      return
    }

    // ── Summary ────────────────────────────────────────────────────
    const totalInvoiced   = (invoices || []).reduce((s, i) => s + Number(i.total || 0), 0)
    const totalCollected  = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0)
    const totalOutstanding = (invoices || []).filter(i => ['sent','overdue'].includes(i.status)).reduce((s, i) => s + Number(i.total || 0), 0)
    const totalOverdue    = (invoices || []).filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.total || 0), 0)
    const activePlacements = (placements || []).filter(p => p.status === 'active').length

    // ── Revenue by Carrier / TPA ───────────────────────────────────
    const carrierMap = {}
    ;(invoices || []).forEach(inv => {
      const key = inv.carrier_tpa_name || 'Unknown'
      if (!carrierMap[key]) carrierMap[key] = { name: key, invoiced: 0, collected: 0, invoiceCount: 0 }
      carrierMap[key].invoiced += Number(inv.total || 0)
      carrierMap[key].invoiceCount++
      if (inv.status === 'paid') carrierMap[key].collected += Number(inv.total || 0)
    })
    const revenueByCarrier = Object.values(carrierMap).sort((a, b) => b.invoiced - a.invoiced)

    // ── Adjuster Leaderboard ───────────────────────────────────────
    const adjMap = {}
    ;(placements || []).forEach(p => {
      if (!p.adjuster) return
      const key = p.adjuster.id
      if (!adjMap[key]) adjMap[key] = { id: key, name: p.adjuster.name, carrier: p.adjuster.carrier, total: 0, active: 0, discharged: 0 }
      adjMap[key].total++
      if (p.status === 'active') adjMap[key].active++
      if (p.status === 'discharged') adjMap[key].discharged++
    })
    const adjusterLeaderboard = Object.values(adjMap).sort((a, b) => b.total - a.total)

    // ── Unit Utilization ───────────────────────────────────────────
    const unitMap = {}
    ;(placements || []).forEach(p => {
      if (!p.unit?.id) return
      const key = p.unit.id
      if (!unitMap[key]) unitMap[key] = {
        id: key, unit_id: p.unit.unit_id,
        property_name: p.unit.property_name, city: p.unit.city, state: p.unit.state,
        placements: 0, active: 0, revenue: 0,
      }
      unitMap[key].placements++
      if (p.status === 'active') unitMap[key].active++
    })
    ;(invoices || []).forEach(inv => {
      const pl = (placements || []).find(p => p.id === inv.placement_id)
      if (pl?.unit?.id && unitMap[pl.unit.id]) {
        unitMap[pl.unit.id].revenue += Number(inv.total || 0)
      }
    })
    const unitUtilization = Object.values(unitMap).sort((a, b) => b.revenue - a.revenue)

    // ── Monthly Revenue (paid invoices, last 12 months) ────────────
    const monthMap = {}
    ;(invoices || []).filter(i => i.status === 'paid').forEach(inv => {
      const month = (inv.date_paid || inv.created_at || '').substring(0, 7)
      if (!month) return
      monthMap[month] = (monthMap[month] || 0) + Number(inv.total || 0)
    })
    const monthlyRevenue = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => ({ month, amount }))

    // ── Placements by State ────────────────────────────────────────
    const stateMap = {}
    ;(placements || []).forEach(p => {
      const state = p.unit?.state || 'Unknown'
      if (!stateMap[state]) stateMap[state] = { state, total: 0, active: 0 }
      stateMap[state].total++
      if (p.status === 'active') stateMap[state].active++
    })
    const placementsByState = Object.values(stateMap).sort((a, b) => b.total - a.total)

    setData({
      summary: { totalInvoiced, totalCollected, totalOutstanding, totalOverdue, activePlacements, totalPlacements: (placements || []).length, totalUnits: (units || []).length },
      revenueByCarrier,
      adjusterLeaderboard,
      unitUtilization,
      monthlyRevenue,
      placementsByState,
      rawPlacements: placements || [],
      rawInvoices: invoices || [],
    })
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  return { data, loading, error, refetch: fetch }
}
