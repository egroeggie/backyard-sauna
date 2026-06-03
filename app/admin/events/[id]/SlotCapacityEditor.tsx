'use client'

import { useState } from 'react'

type Waiver = { token: string; signed_at: string | null }
type Booking = { id: string; name: string; email: string; spaces: number; status: string; waivers: Waiver[] }
type Slot = { id: string; start_time: string; end_time: string; capacity: number; bookings: Booking[]; event_title: string; event_date: string }

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

  // Waiver resend state: keyed by waiver token
  const [resending, setResending] = useState<Record<string, boolean>>({})
  const [resendMsg, setResendMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  // Walk-in waiver state: keyed by slot id
  const [walkInOpen, setWalkInOpen] = useState<Record<string, boolean>>({})
  const [walkInEmail, setWalkInEmail] = useState<Record<string, string>>({})
  const [walkInName, setWalkInName] = useState<Record<string, string>>({})
  const [walkInSending, setWalkInSending] = useState<Record<string, boolean>>({})
  const [walkInMsg, setWalkInMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

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

  async function handleResend(token: string, email: string, name: string) {
    setResending(p => ({ ...p, [token]: true }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', waiver_token: token, email, name }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResendMsg(p => ({ ...p, [token]: { text: json.error ?? 'Error', ok: false } }))
      } else {
        setResendMsg(p => ({ ...p, [token]: { text: 'Sent ✓', ok: true } }))
        setTimeout(() => setResendMsg(p => ({ ...p, [token]: { text: '', ok: true } })), 3000)
      }
    } catch {
      setResendMsg(p => ({ ...p, [token]: { text: 'Network error', ok: false } }))
    } finally {
      setResending(p => ({ ...p, [token]: false }))
    }
  }

  async function handleWalkIn(slotId: string, eventTitle: string, eventDate: string) {
    const email = walkInEmail[slotId]?.trim()
    if (!email) return
    setWalkInSending(p => ({ ...p, [slotId]: true }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'walk_in',
          event_title: eventTitle,
          event_date: eventDate,
          email,
          name: walkInName[slotId]?.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setWalkInMsg(p => ({ ...p, [slotId]: { text: json.error ?? 'Error', ok: false } }))
      } else {
        setWalkInMsg(p => ({ ...p, [slotId]: { text: `Waiver sent to ${email} ✓`, ok: true } }))
        setWalkInEmail(p => ({ ...p, [slotId]: '' }))
        setWalkInName(p => ({ ...p, [slotId]: '' }))
        setWalkInOpen(p => ({ ...p, [slotId]: false }))
        setTimeout(() => setWalkInMsg(p => ({ ...p, [slotId]: { text: '', ok: true } })), 4000)
      }
    } catch {
      setWalkInMsg(p => ({ ...p, [slotId]: { text: 'Network error', ok: false } }))
    } finally {
      setWalkInSending(p => ({ ...p, [slotId]: false }))
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
        const wiMsg = walkInMsg[slot.id]

        return (
          <div key={slot.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-semibold">{fmt(slot.start_time)} – {fmt(slot.end_time)}</h2>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{totalBooked} /</span>
                  <input
                    type="number"
                    min={5}
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
              <table className="w-full text-sm mb-4">
                <thead><tr className="text-left text-gray-500">
                  <th className="pb-2">Name</th><th className="pb-2">Email</th>
                  <th className="pb-2">Spaces</th><th className="pb-2">Waivers</th>
                </tr></thead>
                <tbody>
                  {confirmed.map(b => {
                    const signed = b.waivers.filter(w => w.signed_at).length
                    const unsignedWaivers = b.waivers.filter(w => !w.signed_at)
                    return (
                      <tr key={b.id} className="border-t">
                        <td className="py-2">{b.name}</td>
                        <td className="py-2">{b.email}</td>
                        <td className="py-2">{b.spaces}</td>
                        <td className="py-2">
                          <div className="flex flex-col gap-1">
                            <span className={signed === b.spaces ? 'text-green-600' : 'text-orange-500'}>
                              {signed}/{b.spaces} signed
                            </span>
                            {unsignedWaivers.map(w => {
                              const rm = resendMsg[w.token]
                              return (
                                <div key={w.token} className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleResend(w.token, b.email, b.name)}
                                    disabled={resending[w.token]}
                                    className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                                  >
                                    {resending[w.token] ? 'Sending…' : 'Resend waiver'}
                                  </button>
                                  {rm?.text && (
                                    <span className={`text-xs ${rm.ok ? 'text-green-600' : 'text-red-600'}`}>
                                      {rm.text}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Walk-in waiver */}
            <div className="border-t pt-3 mt-1">
              {!walkInOpen[slot.id] ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setWalkInOpen(p => ({ ...p, [slot.id]: true }))}
                    className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    + Walk-in waiver
                  </button>
                  {wiMsg?.text && (
                    <span className={`text-xs ${wiMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                      {wiMsg.text}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">New walk-in waiver</p>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={walkInName[slot.id] ?? ''}
                      onChange={e => setWalkInName(p => ({ ...p, [slot.id]: e.target.value }))}
                      className="text-sm border rounded px-2 py-1 w-40"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={walkInEmail[slot.id] ?? ''}
                      onChange={e => setWalkInEmail(p => ({ ...p, [slot.id]: e.target.value }))}
                      className="text-sm border rounded px-2 py-1 w-48"
                    />
                    <button
                      onClick={() => handleWalkIn(slot.id, slot.event_title, slot.event_date)}
                      disabled={walkInSending[slot.id] || !walkInEmail[slot.id]?.trim()}
                      className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {walkInSending[slot.id] ? 'Sending…' : 'Send waiver'}
                    </button>
                    <button
                      onClick={() => setWalkInOpen(p => ({ ...p, [slot.id]: false }))}
                      className="text-sm px-2 py-1 rounded text-gray-500 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                  {wiMsg?.text && (
                    <span className={`text-xs ${wiMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                      {wiMsg.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
