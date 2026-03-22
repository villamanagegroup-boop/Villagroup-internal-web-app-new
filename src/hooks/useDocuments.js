import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDocuments(entityType = 'resource_hub', entityId = null) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('documents')
      .select('*')
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })

    if (entityId) q = q.eq('entity_id', entityId)

    const { data, error: err } = await q
    if (err) setError(err.message)
    else setDocuments(data || [])
    setLoading(false)
  }, [entityType, entityId])

  useEffect(() => { load() }, [load])

  async function uploadDocument(file, meta) {
    const safeName = file.name.replace(/\s+/g, '_')
    const path = `${entityType}/${entityId || 'hub'}/${Date.now()}_${safeName}`

    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (upErr) return { error: upErr.message }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('documents').insert({
      name: meta.name || file.name,
      category: meta.category || 'general',
      description: meta.description || null,
      file_url: urlData.publicUrl,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
      entity_type: entityType,
      entity_id: entityId || null,
    })

    if (dbErr) return { error: dbErr.message }
    await load()
    return { success: true }
  }

  async function deleteDocument(doc) {
    if (doc.file_path) {
      await supabase.storage.from('documents').remove([doc.file_path])
    }
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocuments(d => d.filter(x => x.id !== doc.id))
  }

  return { documents, loading, error, uploadDocument, deleteDocument }
}
