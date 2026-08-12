import { createServiceClient } from '@/lib/supabase/service'
import type { WaiverSignature } from '@/types'

export async function createWaiverSignatures(bookingId: string, count: number): Promise<WaiverSignature[]> {
  const sb = createServiceClient()
  const records = Array.from({ length: count }, () => ({ booking_id: bookingId }))
  const { data, error } = await sb.from('waiver_signatures').insert(records).select()
  if (error) throw new Error(error.message)
  return data
}

export async function getWaiverByToken(token: string): Promise<WaiverSignature> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures').select('*').eq('token', token).single()
  if (error) throw new Error(error.message)
  return data
}

export async function signWaiver(token: string, name: string, dob: string, email: string, eventTitle: string, eventDate: string): Promise<WaiverSignature> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures')
    .update({ name, dob, email, signed_at: new Date().toISOString(), event_title: eventTitle, event_date: eventDate })
    .eq('token', token).is('signed_at', null).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function getAllSignedWaivers(): Promise<WaiverSignature[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures')
    .select('*').not('signed_at', 'is', null)
    .order('event_date', { ascending: false }).order('signed_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getWaiversByBookingId(bookingId: string): Promise<WaiverSignature[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures').select('*').eq('booking_id', bookingId)
  if (error) throw new Error(error.message)
  return data
}

export async function deleteUnsignedWaiverSignatures(bookingId: string, count: number): Promise<number> {
  const sb = createServiceClient()
  const { data: candidates, error: selErr } = await sb.from('waiver_signatures')
    .select('id')
    .eq('booking_id', bookingId)
    .is('signed_at', null)
    .limit(count)
  if (selErr) throw new Error(selErr.message)
  if (!candidates || candidates.length === 0) return 0

  const ids = candidates.map(c => c.id)
  const { error: delErr } = await sb.from('waiver_signatures').delete().in('id', ids)
  if (delErr) throw new Error(delErr.message)
  return ids.length
}

export async function createWalkInWaiver(eventTitle: string, eventDate: string): Promise<WaiverSignature> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures')
    .insert({ booking_id: null, event_title: eventTitle, event_date: eventDate })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export interface WaiverWithContext extends WaiverSignature {
  resolved_event_title: string | null
  resolved_event_date: string | null
  booking_name: string | null
  booking_email: string | null
}

interface RawWaiverRow extends WaiverSignature {
  bookings: { name: string; email: string; slots: { events: { title: string; date: string } | null } | null } | null
}

export async function getAllWaivers(): Promise<WaiverWithContext[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures')
    .select('*, bookings(name, email, slots(events(title, date)))')
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as RawWaiverRow[]
  return rows
    .map(w => {
      const { bookings, ...rest } = w
      const event = bookings?.slots?.events ?? null
      return {
        ...rest,
        resolved_event_title: w.event_title ?? event?.title ?? null,
        resolved_event_date: w.event_date ?? event?.date ?? null,
        booking_name: bookings?.name ?? null,
        booking_email: bookings?.email ?? null,
      }
    })
    .sort((a, b) => {
      const ad = a.resolved_event_date ?? ''
      const bd = b.resolved_event_date ?? ''
      if (ad !== bd) return bd.localeCompare(ad)
      const as = a.signed_at ?? ''
      const bs = b.signed_at ?? ''
      return bs.localeCompare(as)
    })
}

export async function markWaiverSigned(id: string, fields: { name?: string; email?: string; dob?: string }): Promise<WaiverSignature> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures')
    .update({ ...fields, signed_at: new Date().toISOString() })
    .eq('id', id).is('signed_at', null).select().single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Waiver already signed or not found')
  return data
}

export async function updateWaiver(id: string, updates: Partial<Pick<WaiverSignature, 'name' | 'email' | 'dob'>>): Promise<WaiverSignature> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteWaiver(id: string): Promise<void> {
  const sb = createServiceClient()
  const { error } = await sb.from('waiver_signatures').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
