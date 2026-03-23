import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TASK_SELECT = `
  id, title, description, status, priority, category,
  linked_id, linked_label, due_date, completed_at, created_at, updated_at,
  assignee:assigned_to (id, full_name),
  creator:created_by (id, full_name)
`

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetch() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetch()
    const sub = supabase
      .channel('tasks-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function createTask(payload) {
    const { data, error: err } = await supabase
      .from('tasks')
      .insert(payload)
      .select(TASK_SELECT)
      .single()
    if (err) throw new Error(err.message)
    return data
  }

  async function updateTask(id, updates) {
    const { error: err } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw new Error(err.message)
  }

  async function deleteTask(id) {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id)
    if (err) throw new Error(err.message)
  }

  return { tasks, loading, error, refetch: fetch, createTask, updateTask, deleteTask }
}
