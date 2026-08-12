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
