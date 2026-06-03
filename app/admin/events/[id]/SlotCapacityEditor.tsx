'use client'

import { useState } from 'react'

type Waiver = { signed_at: string | null }
type Booking = { id: string; name: string; email: string; spaces: number; status: string; waivers: Waiver[] }
type Slot = { id: string; start_time: string; end_time: string; capacity: number; bookings: Booking[] }

export default function SlotCapacityEditor({ slots }: { slots: Slot[] }) {
  const fmt = (t: string) => t.slice(0, 5)

  const [capacities, setCapacities] = useState<Record<string, number>>(
    Object.fromEntries(slots.map(s => [s.id, s.capacity]))
  )
  const [saved, setSaved] = useState<Record<string, number>>(
    Object.fromEntries(slots.map(s => [s.id, s.capacity]))
  )
  const [messages, setMessages] = useState<Record<string, { text: string; ok: boolean }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  async function handleSave(slotId: string) {
    setSaving(p => ({ ...p, [slotId]: true }))
    setMessages(p => ({ ...p, [slotId]: { text: '', ok: true } }))
    try {
      const res = await fetch(`/api/admin/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: capacities[slotId] }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessages(p => ({ ...p, [slotId]: { text: json.error ?? 'Error saving', ok: false } }))
      } else {
        setSaved(p => ({ ...p, [slotId]: capacities[slotId] }))
        setMessages(p => ({ ...p, [slotId]: { text: 'Saved ✓', ok: true } }))
        setTimeout(() => setMessages(p => ({ ...p, [slotId]: { text: '', ok: true } })), 2500)
      }
    } catch {
      setMessages(p => ({ ...p, [slotId]: { text: 'Network error', ok: false } }))
    } finally {
      setSaving(p => ({ ...p, [slotId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {slots.map(slot => {
        const confirmed = slot.bookings.filter(b => b.status === 'confirmed')
        const totalBooked = confirmed.reduce((sum, b) => sum + b.spaces, 0)
        const currentCap = capacities[slot.id]
        const unchanged = currentCap === saved[slot.id]
        const msg = messages[slot.id]

        return (
          <div key={slot.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-semibold">{fmt(slot.start_time)} – {fmt(slot.end_time)}</h2>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{totalBooked} /</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={currentCap}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v)) setCapacities(p => ({ ...p, [slot.id]: v }))
                    }}
                    className="w-16 text-sm border rounded px-1 py-0.5 text-center"
                  />
                  <button
                    onClick={() => handleSave(slot.id)}
                    disabled={unchanged || saving[slot.id]}
                    className={`text-sm px-2 py-0.5 rounded ${
                      unchanged || saving[slot.id]
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Save
                  </button>
                </div>
                {msg?.text && (
                  <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
                    {msg.text}
                  </span>
                )}
              </div>
            </div>
            {confirmed.length === 0 ? <p className="text-gray-400 text-sm">No bookings yet.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500">
                  <th className="pb-2">Name</th><th className="pb-2">Email</th>
                  <th className="pb-2">Spaces</th><th className="pb-2">Waivers</th>
                </tr></thead>
                <tbody>
                  {confirmed.map(b => {
                    const signed = b.waivers.filter(w => w.signed_at).length
                    return (
                      <tr key={b.id} className="border-t">
                        <td className="py-2">{b.name}</td>
                        <td className="py-2">{b.email}</td>
                        <td className="py-2">{b.spaces}</td>
                        <td className="py-2">
                          <span className={signed === b.spaces ? 'text-green-600' : 'text-orange-500'}>
                            {signed}/{b.spaces} signed
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
