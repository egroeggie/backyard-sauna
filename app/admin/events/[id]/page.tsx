import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getSlotsByEventId } from '@/lib/db/slots'
import { getBookingsBySlotId } from '@/lib/db/bookings'
import { getWaiversByBookingId } from '@/lib/db/waivers'

export const dynamic = 'force-dynamic'

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let event
  try { event = await getEventById(id) } catch { notFound() }

  const slots = await getSlotsByEventId(id)
  const slotsWithBookings = await Promise.all(slots.map(async slot => {
    const bookings = await getBookingsBySlotId(slot.id)
    const bookingsWithWaivers = await Promise.all(
      bookings.map(async b => ({ ...b, waivers: await getWaiversByBookingId(b.id) }))
    )
    return { ...slot, bookings: bookingsWithWaivers }
  }))

  const fmt = (t: string) => t.slice(0, 5)

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">{event.title}</h1>
      <p className="text-gray-600 mb-6">{event.date} · {event.location}</p>
      <div className="space-y-6">
        {slotsWithBookings.map(slot => {
          const confirmed = slot.bookings.filter(b => b.status === 'confirmed')
          const totalBooked = confirmed.reduce((sum, b) => sum + b.spaces, 0)
          return (
            <div key={slot.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">{fmt(slot.start_time)} – {fmt(slot.end_time)}</h2>
                <span className="text-sm text-gray-500">{totalBooked} / {slot.capacity} booked</span>
              </div>
              {confirmed.length === 0 ? <p className="text-gray-400 text-sm">No bookings yet.</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500">
                    <th className="pb-2">Name</th><th className="pb-2">Email</th>
                    <th className="pb-2">Spaces</th><th className="pb-2">Waivers</th>
                  </tr></thead>
                  <tbody>
                    {confirmed.map(b => {
                      const signed = b.waivers.filter(w => w.signed_at).length
                      return (
                        <tr key={b.id} className="border-t">
                          <td className="py-2">{b.name}</td>
                          <td className="py-2">{b.email}</td>
                          <td className="py-2">{b.spaces}</td>
                          <td className="py-2">
                            <span className={signed === b.spaces ? 'text-green-600' : 'text-orange-500'}>
                              {signed}/{b.spaces} signed
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
