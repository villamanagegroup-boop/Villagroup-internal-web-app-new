import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useContacts(types) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const key = Array.isArray(types) ? types.join(',') : (types ?? 'all')

  async function fetch() {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('is_archived', false)
      .order('name', { ascending: true })

    if (Array.isArray(types) && types.length > 0) {
      query = query.in('type', types)
    } else if (types && !Array.isArray(types)) {
      query = query.eq('type', types)
    } else {
      query = query.neq('type', 'policyholder')
    }

    const { data, error } = await query
    if (error) setError(error.message)
    else setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetch()
    const sub = supabase
      .channel(`contacts-${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [key])

  return { contacts, loading, error, refetch: fetch }
}
