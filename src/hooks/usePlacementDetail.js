import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePlacementDetail(id) {
  const [placement, setPlacement] = useState(null)
  const [notes, setNotes] = useState([])
  const [activity, setActivity] = useState([])
  const [checklists, setChecklists] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    if (!id) return
    setLoading(true)
    setError(null)

    const [
      { data: p, error: pErr },
      { data: notesData },
      { data: activityData },
      { data: checklistData },
      { data: invoiceData },
    ] = await Promise.all([
      supabase
        .from('placements')
        .select(`
          *,
          policyholder:policyholder_id (*),
          adjuster:adjuster_id (*),
          unit:unit_id (*)
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('notes')
        .select('*')
        .eq('placement_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_log')
        .select('*')
        .eq('entity_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('checklists')
        .select('*, items:checklist_items(*)')
        .eq('placement_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('invoices')
        .select('*')
        .eq('placement_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (pErr) setError(pErr.message)
    else {
      setPlacement(p)
      setNotes(notesData || [])
      setActivity(activityData || [])
      setChecklists(
        (checklistData || []).map(c => ({
          ...c,
          items: (c.items || []).sort((a, b) => a.sort_order - b.sort_order),
        }))
      )
      setInvoices(invoiceData || [])
    }
    setLoading(false)
  }

  async function addNote(body) {
    const { error } = await supabase.from('notes').insert({ placement_id: id, body })
    if (!error) {
      await supabase.from('activity_log').insert({
        entity_type: 'placement',
        entity_id: id,
        action: 'note_added',
        description: 'Note added',
      })
      fetch()
    }
    return error
  }

  async function updateStatus(newStatus) {
    const { error } = await supabase
      .from('placements')
      .update({ status: newStatus })
      .eq('id', id)
    if (!error) fetch()
    return error
  }

  async function toggleChecklistItem(itemId, completed) {
    const { error } = await supabase
      .from('checklist_items')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? 'Staff' : null,
      })
      .eq('id', itemId)
    if (!error) fetch()
    return error
  }

  useEffect(() => {
    fetch()
  }, [id])

  return {
    placement, notes, activity, checklists, invoices,
    loading, error,
    addNote, updateStatus, toggleChecklistItem,
    refetch: fetch,
  }
}
