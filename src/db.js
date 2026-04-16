import { supabase } from './supabaseClient'

// ===== PROFILE =====
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

// ===== CLIENTS =====
export async function getClients() {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createClient(client) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('clients').insert({ ...client, user_id: user.id }).select().single()
  if (error) throw error
  return data
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase.from('clients').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

// ===== TASKS =====
export async function getTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('day', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getTasksByClientMonth(clientId, month, year) {
  const { data, error } = await supabase.from('tasks').select('*').eq('client_id', clientId).eq('month', month).eq('year', year).order('day')
  if (error) throw error
  return data || []
}

export async function createTask(task) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('tasks').insert({ ...task, user_id: user.id }).select().single()
  if (error) throw error
  return data
}

export async function createTasks(tasks) {
  const { data: { user } } = await supabase.auth.getUser()
  const rows = tasks.map(t => ({ ...t, user_id: user.id }))
  const { data, error } = await supabase.from('tasks').insert(rows).select()
  if (error) throw error
  return data || []
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function deleteTasksByClientMonth(clientId, month, year) {
  const { error } = await supabase.from('tasks').delete().eq('client_id', clientId).eq('month', month).eq('year', year)
  if (error) throw error
}

// ===== CONTENT TYPES =====
export async function getContentTypes() {
  const { data, error } = await supabase.from('content_types').select('*').order('created_at')
  if (error) throw error
  return data || []
}

export async function createContentType(ct) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('content_types').insert({ ...ct, user_id: user.id }).select().single()
  if (error) throw error
  return data
}

export async function updateContentType(id, updates) {
  const { data, error } = await supabase.from('content_types').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteContentType(id) {
  const { error } = await supabase.from('content_types').delete().eq('id', id)
  if (error) throw error
}

// ===== AUTH =====
export async function signOut() {
  await supabase.auth.signOut()
}
