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

export async function createWalkInWaiver(eventTitle: string, eventDate: string): Promise<WaiverSignature> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('waiver_signatures')
    .insert({ booking_id: null, event_title: eventTitle, event_date: eventDate })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}
