import { getPublishedEvents } from '@/lib/db/events'
import { EventCard } from '@/components/EventCard'
import { NavBar } from '@/components/NavBar'
import Link from 'next/link'

export const revalidate = 60

export default async function EventsPage() {
  const events = await getPublishedEvents()
  return (
    <div className="min-h-screen bg-[#1f3e2a] pb-10">
      <div className="max-w-[440px] sm:max-w-[640px] mx-auto px-6 pt-20">
        <h1 className="font-display text-[#edea5a] text-[36px] leading-[50px] text-center mb-8">Events</h1>
        {events.length === 0 ? (
          <p className="text-[#edea5a]/70 text-center font-light">No upcoming events. Check back soon.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
        <p className="text-center text-[#edea5a]/50 text-xs mt-4">
          <Link href="/policy" className="underline hover:text-[#edea5a]/80 transition-colors">Booking &amp; cancellation policy</Link>
        </p>
      </div>
      <NavBar />
    </div>
  )
}
