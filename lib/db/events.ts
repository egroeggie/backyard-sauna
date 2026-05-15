import { createServiceClient } from '@/lib/supabase/service'
import type { Event } from '@/types'

export async function getPublishedEvents(): Promise<Event[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('events').select('*')
    .eq('is_published', true).order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function getEventById(id: string): Promise<Event> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('events').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function getAllEvents(): Promise<Event[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('events').select('*').order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('events').insert(event).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateEvent(id: string, updates: Partial<Omit<Event, 'id' | 'created_at'>>): Promise<Event> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('events').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}
