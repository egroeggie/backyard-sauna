import { notFound } from 'next/navigation'
import { getCheckinRoster } from '@/lib/db/waivers'
import CheckinRoster from './CheckinRoster'

export const dynamic = 'force-dynamic'

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let roster
  try { roster = await getCheckinRoster(id) } catch { notFound() }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">{roster.eventTitle}</h1>
      <p className="text-gray-600 mb-6">{roster.eventDate} — Check-in</p>
      <CheckinRoster roster={roster} />
    </div>
  )
}
