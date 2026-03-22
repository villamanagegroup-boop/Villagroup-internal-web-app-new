import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUnitDetail(id) {
  const [unit, setUnit] = useState(null)
  const [notes, setNotes] = useState([])
  const [photos, setPhotos] = useState([])
  const [placements, setPlacements] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    if (!id) return
    setLoading(true)
    setError(null)

    const [
      { data: u, error: uErr },
      { data: notesData },
      { data: photosData },
      { data: placementsData },
    ] = await Promise.all([
      supabase.from('units').select('*, vendor:vendor_id(*)').eq('id', id).single(),
      supabase.from('notes').select('*').eq('unit_id', id).order('created_at', { ascending: false }),
      supabase.from('unit_photos').select('*').eq('unit_id', id).order('sort_order', { ascending: true }),
      supabase
        .from('placements')
        .select('id, claim_number, carrier_name, status, move_in_date, move_out_date, policyholder:policyholder_id(name)')
        .eq('unit_id', id)
        .order('move_in_date', { ascending: false }),
    ])

    if (uErr) { setError(uErr.message); setLoading(false); return }

    let invoicesData = []
    const placementIds = (placementsData || []).map(p => p.id)
    if (placementIds.length > 0) {
      const { data: inv } = await supabase
        .from('invoices')
        .select('id, invoice_number, carrier_tpa_name, total, status, due_date, placement_id')
        .in('placement_id', placementIds)
        .order('created_at', { ascending: false })
      invoicesData = inv || []
    }

    setUnit(u)
    setNotes(notesData || [])
    setPhotos(photosData || [])
    setPlacements(placementsData || [])
    setInvoices(invoicesData)
    setLoading(false)
  }

  async function updateStatus(newStatus) {
    const { error } = await supabase
      .from('units')
      .update({ status: newStatus, last_updated: new Date().toISOString() })
      .eq('id', id)
    if (!error) fetch()
    return error
  }

  async function addNote(body) {
    const { error } = await supabase.from('notes').insert({ unit_id: id, body })
    if (!error) fetch()
    return error
  }

  async function uploadPhoto(file) {
    const ext = file.name.split('.').pop()
    const path = `${id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('unit-photos').upload(path, file)
    if (upErr) return upErr

    const { data: { publicUrl } } = supabase.storage.from('unit-photos').getPublicUrl(path)
    const { error: dbErr } = await supabase.from('unit_photos').insert({
      unit_id: id,
      url: publicUrl,
      sort_order: photos.length,
    })
    if (!dbErr) fetch()
    return dbErr
  }

  async function deletePhoto(photoId, url) {
    await supabase.from('unit_photos').delete().eq('id', photoId)
    // Extract storage path from URL and remove from bucket
    const path = url.split('/unit-photos/')[1]
    if (path) await supabase.storage.from('unit-photos').remove([path])
    fetch()
  }

  useEffect(() => { fetch() }, [id])

  return { unit, notes, photos, placements, invoices, loading, error, updateStatus, addNote, uploadPhoto, deletePhoto, refetch: fetch }
}
