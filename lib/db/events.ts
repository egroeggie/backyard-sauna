import { createServiceClient } from '@/lib/supabase/service'
import type { Event } from '@/types'

export async function getPublishedEvents(): Promise<Event[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('events').select('*')
    .eq('is_published', true).eq('archived', false).order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function getEventById(id: string): Promise<Event> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('events').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function getAllEvents(includeArchived = false): Promise<Event[]> {
  const sb = createServiceClient()
  let query = sb.from('events').select('*').order('date', { ascending: false })
  if (!includeArchived) query = query.eq('archived', false)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'archived'>): Promise<Event> {
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

export async function eventHasHistory(id: string): Promise<boolean> {
  const sb = createServiceClient()

  const { data: slots, error: slotsErr } = await sb.from('slots').select('id').eq('event_id', id)
  if (slotsErr) throw new Error(slotsErr.message)

  if (slots && slots.length > 0) {
    const { count, error: bookingsErr } = await sb.from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('slot_id', slots.map(s => s.id))
    if (bookingsErr) throw new Error(bookingsErr.message)
    if (count && count > 0) return true
  }

  const event = await getEventById(id)
  const { count: waiverCount, error: waiverErr } = await sb.from('waiver_signatures')
    .select('id', { count: 'exact', head: true })
    .is('booking_id', null)
    .eq('event_title', event.title)
    .eq('event_date', event.date)
    .not('signed_at', 'is', null)
  if (waiverErr) throw new Error(waiverErr.message)

  return !!(waiverCount && waiverCount > 0)
}

export async function deleteEvent(id: string): Promise<void> {
  const sb = createServiceClient()
  const { error } = await sb.from('events').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
