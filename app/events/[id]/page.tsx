import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getSlotsByEventId } from '@/lib/db/slots'
import { BookingForm } from '@/components/BookingForm'
import { NavBar } from '@/components/NavBar'
import Link from 'next/link'

export const revalidate = 30

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let event, slots
  try { event = await getEventById(id); slots = await getSlotsByEventId(id) }
  catch { notFound() }
  if (!event.is_published) notFound()

  const price = (event.price_pence / 100).toFixed(0)
  const date = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#1f3e2a] pb-[90px]">
      <div className="max-w-[440px] mx-auto px-6 pt-8 flex flex-col gap-6">
        <Link href="/events" className="text-[#edea5a] opacity-70 hover:opacity-100 transition-opacity">←</Link>

        <h1 className="font-display text-[#edea5a] text-4xl text-center">{event.title}</h1>

        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="w-full h-52 object-cover rounded-lg opacity-90" />
        )}

        <div className="bg-[rgba(178,254,255,0.08)] border border-[#edea5a]/40 rounded-[10px] p-4 flex flex-col gap-2">
          <p className="text-[#edea5a] font-light">{date}</p>
          <p className="text-[#edea5a] font-light">{event.location}</p>
          <p className="text-[#edea5a] font-light">£{price} per person</p>
        </div>

        <p className="text-[#edea5a] font-light leading-relaxed whitespace-pre-wrap">{event.description}</p>

        <BookingForm slots={slots} eventId={id} />
      </div>
      <NavBar />
    </div>
  )
}
