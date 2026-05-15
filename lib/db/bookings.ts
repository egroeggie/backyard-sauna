import { createServiceClient } from '@/lib/supabase/service'
import type { Booking } from '@/types'

type CreateInput = { slot_id: string; name: string; email: string; spaces: number; waiver_accepted: boolean }

export async function createPendingBooking(input: CreateInput): Promise<Booking> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('bookings').insert({ ...input, status: 'pending' }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function confirmBooking(id: string, stripePaymentId: string): Promise<Booking> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('bookings')
    .update({ status: 'confirmed', stripe_payment_id: stripePaymentId })
    .eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function cancelBooking(id: string): Promise<void> {
  const sb = createServiceClient()
  const { error } = await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getBookingById(id: string): Promise<Booking> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('bookings').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function getBookingsBySlotId(slotId: string): Promise<Booking[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('bookings').select('*').eq('slot_id', slotId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function expirePendingBookings(): Promise<void> {
  const sb = createServiceClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { error } = await sb.from('bookings').update({ status: 'cancelled' })
    .eq('status', 'pending').lt('created_at', oneHourAgo)
  if (error) throw new Error(error.message)
}
