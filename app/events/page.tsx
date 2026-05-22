import { getPublishedEvents } from '@/lib/db/events'
import { EventCard } from '@/components/EventCard'
import { NavBar } from '@/components/NavBar'

export const revalidate = 60

export default async function EventsPage() {
  const events = await getPublishedEvents()
  return (
    <div className="min-h-screen bg-[#1f3e2a] pb-[90px]">
      <div className="max-w-[440px] mx-auto px-6 pt-12">
        <h1 className="font-display text-[#edea5a] text-4xl mb-8 text-center">Events</h1>
        {events.length === 0 ? (
          <p className="text-[#edea5a]/70 text-center font-light">No upcoming events. Check back soon.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </div>
      <NavBar />
    </div>
  )
}
