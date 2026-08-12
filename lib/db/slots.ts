import { createServiceClient } from '@/lib/supabase/service'
import type { Slot, SlotWithAvailability } from '@/types'

export async function getSlotsByEventId(eventId: string): Promise<SlotWithAvailability[]> {
  const sb = createServiceClient()
  const { data: slots, error } = await sb.from('slots').select('*')
    .eq('event_id', eventId).order('start_time', { ascending: true })
  if (error) throw new Error(error.message)

  return Promise.all(slots.map(async (slot) => {
    const { data: bookings, error: bErr } = await sb.from('bookings').select('spaces')
      .eq('slot_id', slot.id).eq('status', 'confirmed')
    if (bErr) throw new Error(bErr.message)
    const booked = (bookings ?? []).reduce((sum, b) => sum + b.spaces, 0)
    return { ...slot, available_spaces: slot.capacity - booked }
  }))
}

export async function getSlotById(id: string): Promise<Slot> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('slots').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createSlots(slots: Omit<Slot, 'id'>[]): Promise<Slot[]> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('slots').insert(slots).select()
  if (error) throw new Error(error.message)
  return data
}

export async function updateSlot(id: string, updates: Partial<Pick<Slot, 'start_time' | 'end_time' | 'capacity'>>): Promise<Slot> {
  const sb = createServiceClient()
  const { data, error } = await sb.from('slots').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteSlot(id: string): Promise<void> {
  const sb = createServiceClient()
  const { error } = await sb.from('slots').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
