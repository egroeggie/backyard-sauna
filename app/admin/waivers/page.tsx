import { getAllSignedWaivers } from '@/lib/db/waivers'

export const dynamic = 'force-dynamic'

export default async function AdminWaiversPage() {
  const waivers = await getAllSignedWaivers()

  const grouped = waivers.reduce<Record<string, typeof waivers>>((acc, w) => {
    const key = `${w.event_date ?? 'unknown'}__${w.event_title ?? 'Unknown Event'}`
    acc[key] = acc[key] ?? []
    acc[key].push(w)
    return acc
  }, {})

  const sortedKeys = Object.keys(grouped).sort().reverse()

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Signed Waivers</h1>
      {sortedKeys.length === 0 && <p className="text-gray-400">No signed waivers yet.</p>}
      <div className="space-y-8">
        {sortedKeys.map(key => {
          const [date, title] = key.split('__')
          const rows = grouped[key]
          return (
            <div key={key} className="border rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-1">{title}</h2>
              <p className="text-sm text-gray-500 mb-4">{date}</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Signed at</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(w => (
                    <tr key={w.id} className="border-t">
                      <td className="py-2">{w.name}</td>
                      <td className="py-2">{w.email}</td>
                      <td className="py-2 text-gray-500">{new Date(w.signed_at!).toLocaleString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}
