import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUnits() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('units')
      .select('*, photos:unit_photos(id, url, sort_order)')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setUnits(data || [])
    setLoading(false)
  }

  async function updateStatus(unitId, newStatus) {
    const { error } = await supabase
      .from('units')
      .update({ status: newStatus, last_updated: new Date().toISOString() })
      .eq('id', unitId)
    if (!error) fetch()
    return error
  }

  useEffect(() => {
    fetch()
    const sub = supabase
      .channel('units-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  return { units, loading, error, refetch: fetch, updateStatus }
}
