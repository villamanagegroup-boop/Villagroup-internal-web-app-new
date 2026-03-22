import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePlacements() {
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('placements')
      .select(`
        id, claim_number, carrier_name, status,
        ale_daily_limit, ale_total_cap, ale_running_total, ale_expiry_date,
        move_in_date, move_out_date, created_at,
        policyholder:policyholder_id (id, name, phone, email, household_size, pets),
        adjuster:adjuster_id (id, name, phone, carrier),
        unit:unit_id (id, unit_id, property_name, address, city, state, bedrooms)
      `)
      .order('move_in_date', { ascending: false })

    if (error) setError(error.message)
    else setPlacements(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetch()
    const sub = supabase
      .channel('placements-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placements' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  return { placements, loading, error, refetch: fetch }
}
