import Link from 'next/link'
import { getAllEvents } from '@/lib/db/events'
import { DeleteEventButton } from '@/components/DeleteEventButton'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const events = await getAllEvents()
  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/admin/events/new"
          className="bg-[#E94560] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
          + New event
        </Link>
      </div>
      {events.length === 0 ? <p>No events yet.</p> : (
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id} className="border-t">
                <td className="px-4 py-3">{event.title}</td>
                <td className="px-4 py-3">{event.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${event.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {event.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 items-center">
                    <Link href={`/admin/events/${event.id}`} className="text-[#E94560] hover:underline">Bookings</Link>
                    <Link href={`/admin/events/${event.id}/edit`} className="hover:underline">Edit</Link>
                    <DeleteEventButton id={event.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
