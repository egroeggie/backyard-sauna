import { getAllWaivers } from '@/lib/db/waivers'
import WaiverManager from './WaiverManager'

export const dynamic = 'force-dynamic'

export default async function AdminWaiversPage() {
  const waivers = await getAllWaivers()

  const grouped = waivers.reduce<Record<string, typeof waivers>>((acc, w) => {
    const key = `${w.resolved_event_date ?? 'unknown'}__${w.resolved_event_title ?? 'Unknown Event'}`
    acc[key] = acc[key] ?? []
    acc[key].push(w)
    return acc
  }, {})

  const sortedKeys = Object.keys(grouped).sort().reverse()

  const groups = sortedKeys.map(key => {
    const [date, title] = key.split('__')
    return { key, date, title, waivers: grouped[key] }
  })

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Waivers</h1>
      {groups.length === 0 && <p className="text-gray-400">No waivers yet.</p>}
      <WaiverManager groups={groups} />
    </div>
  )
}
