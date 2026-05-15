import { getPublishedEvents } from '@/lib/db/events'
import { EventCard } from '@/components/EventCard'

export const revalidate = 60

export default async function HomePage() {
  const events = await getPublishedEvents()
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-[#1A1A2E] mb-2">Backyard Sauna</h1>
      <p className="text-gray-600 mb-8">Community pop-up saunas in Stockport.</p>
      {events.length === 0 ? (
        <p className="text-gray-500">No upcoming events. Check back soon.</p>
      ) : (
        <div className="grid gap-6">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </main>
  )
}
