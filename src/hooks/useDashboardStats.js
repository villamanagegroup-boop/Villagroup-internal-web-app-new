import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { addDays, isWithinInterval, startOfWeek, endOfWeek, parseISO } from 'date-fns'

export function useDashboardStats() {
  const [stats, setStats] = useState(null)
  const [actionItems, setActionItems] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      const in7Days = addDays(now, 7)

      const [
        { count: activePlacements },
        { count: availableUnits },
        { data: placements },
        { data: invoicesRaw },
        { data: activity },
      ] = await Promise.all([
        supabase.from('placements').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('placements').select('id, ale_expiry_date, move_in_date, move_out_date, status').eq('status', 'active'),
        supabase.from('invoices').select('id, status, due_date, total, placement_id').in('status', ['sent', 'draft', 'overdue']),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
      ])

      // ALE expiring within 7 days
      const aleExpiring = (placements || []).filter(p => {
        if (!p.ale_expiry_date) return false
        const expiry = parseISO(p.ale_expiry_date)
        return isWithinInterval(expiry, { start: now, end: in7Days })
      }).length

      // Move-ins this week
      const moveInsThisWeek = (placements || []).filter(p => {
        if (!p.move_in_date) return false
        const d = parseISO(p.move_in_date)
        return isWithinInterval(d, { start: weekStart, end: weekEnd })
      }).length

      // Move-outs this week
      const moveOutsThisWeek = (placements || []).filter(p => {
        if (!p.move_out_date) return false
        const d = parseISO(p.move_out_date)
        return isWithinInterval(d, { start: weekStart, end: weekEnd })
      }).length

      // Overdue invoices
      const overdueInvoices = (invoicesRaw || []).filter(inv => {
        if (inv.status === 'overdue') return true
        if (inv.status === 'sent' && inv.due_date && parseISO(inv.due_date) < now) return true
        return false
      }).length

      setStats({
        activePlacements: activePlacements ?? 0,
        availableUnits: availableUnits ?? 0,
        aleExpiring,
        overdueInvoices,
        moveInsThisWeek,
        moveOutsThisWeek,
      })

      // Build action items
      const items = []
      ;(placements || []).forEach(p => {
        if (!p.ale_expiry_date) return
        const expiry = parseISO(p.ale_expiry_date)
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
        if (daysLeft <= 7 && daysLeft >= 0) {
          items.push({
            id: `ale-${p.id}`,
            type: daysLeft <= 2 ? 'critical' : 'warning',
            message: `ALE limit expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            placementId: p.id,
          })
        }
      })
      ;(invoicesRaw || []).forEach(inv => {
        if (inv.status === 'overdue' || (inv.status === 'sent' && inv.due_date && parseISO(inv.due_date) < now)) {
          items.push({
            id: `inv-${inv.id}`,
            type: 'warning',
            message: `Invoice overdue — $${Number(inv.total || 0).toLocaleString()}`,
            invoiceId: inv.id,
          })
        }
      })

      setActionItems(items)
      setRecentActivity(activity || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()

    // Subscribe to real-time changes
    const placementSub = supabase
      .channel('dashboard-placements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placements' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(placementSub)
  }, [])

  return { stats, actionItems, recentActivity, loading, error, refetch: fetchAll }
}
