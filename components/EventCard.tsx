import Link from 'next/link'
import type { Event } from '@/types'

export function EventCard({ event }: { event: Event }) {
  const date = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const price = (event.price_pence / 100).toFixed(0)

  return (
    <Link href={`/events/${event.id}`} className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {event.image_url && (
        <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <h2 className="text-xl font-semibold text-[#1A1A2E]">{event.title}</h2>
        <p className="text-gray-600 mt-1">{date}</p>
        <p className="text-gray-600">{event.location}</p>
        <p className="mt-2 font-medium text-[#E94560]">From £{price} per person</p>
      </div>
    </Link>
  )
}
