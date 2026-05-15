import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/db/events'
import { getSlotsByEventId } from '@/lib/db/slots'
import { BookingForm } from '@/components/BookingForm'

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
    <main className="max-w-2xl mx-auto px-4 py-12">
      <a href="/" className="text-sm text-gray-500 hover:underline mb-4 inline-block">← All events</a>
      {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-64 object-cover rounded-lg mb-6" />}
      <h1 className="text-3xl font-bold text-[#1A1A2E] mb-1">{event.title}</h1>
      <p className="text-gray-600 mb-1">{date}</p>
      <p className="text-gray-600 mb-4">{event.location}</p>
      <p className="font-medium text-[#E94560] mb-6">£{price} per person</p>
      <p className="text-gray-700 mb-8 leading-relaxed">{event.description}</p>
      <BookingForm slots={slots} eventId={id} />
    </main>
  )
}
