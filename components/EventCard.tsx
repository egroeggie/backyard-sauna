import Link from 'next/link'
import type { Event } from '@/types'

export function EventCard({ event }: { event: Event }) {
  const date = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const price = (event.price_pence / 100).toFixed(0)

  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-[rgba(178,254,255,0.1)] border-2 border-[#edea5a] rounded-[10px] p-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.2)] hover:bg-[rgba(178,254,255,0.15)] transition-colors"
    >
      {event.image_url && (
        <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover rounded-lg mb-4 opacity-90" />
      )}
      <div className="flex flex-col gap-2">
        <h2 className="text-[#edea5a] font-medium text-xl">{event.title}</h2>
        <p className="text-[#edea5a] font-light text-base">{date}</p>
        <p className="text-[#edea5a] font-light text-base">{event.location}</p>
        <p className="text-[#edea5a] font-light text-base">£{price}pp</p>
      </div>
    </Link>
  )
}
