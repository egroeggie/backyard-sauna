import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getSlotsByEventId } from '@/lib/db/slots'
import { getBookingsBySlotId } from '@/lib/db/bookings'
import { getWaiversByBookingId } from '@/lib/db/waivers'
import SlotCapacityEditor from './SlotCapacityEditor'

export const dynamic = 'force-dynamic'

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let event
  try { event = await getEventById(id) } catch { notFound() }

  const slots = await getSlotsByEventId(id)
  const slotsWithBookings = await Promise.all(slots.map(async slot => {
    const bookings = await getBookingsBySlotId(slot.id)
    const bookingsWithWaivers = await Promise.all(
      bookings.map(async b => ({
        ...b,
        waivers: (await getWaiversByBookingId(b.id)).map(w => ({ token: w.token, signed_at: w.signed_at })),
      }))
    )
    return { ...slot, event_title: event.title, event_date: event.date, bookings: bookingsWithWaivers }
  }))

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">{event.title}</h1>
      <p className="text-gray-600 mb-6">{event.date} · {event.location}</p>
      <SlotCapacityEditor slots={slotsWithBookings} eventId={event.id} />
    </div>
  )
}
