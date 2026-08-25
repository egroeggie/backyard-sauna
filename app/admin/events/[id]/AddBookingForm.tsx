'use client'

import { useState } from 'react'

export default function AddBookingForm({ slotId }: { slotId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [spaces, setSpaces] = useState(1)
  const [mode, setMode] = useState<'mark_paid' | 'payment_link'>('mark_paid')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleAddBooking() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, name: trimmedName, email: trimmedEmail, spaces, mode }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ text: typeof json.error === 'string' ? json.error : 'Error', ok: false })
      } else {
        setMsg({
          text: mode === 'mark_paid' ? 'Booked & confirmed ✓ Refresh to see it.' : 'Payment link emailed ✓',
          ok: true,
        })
        setName('')
        setEmail('')
        setSpaces(1)
      }
    } catch {
      setMsg({ text: 'Network error', ok: false })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t pt-3 mt-1">
      {!open ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            + Add booking
          </button>
          {msg?.text && (
            <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">New booking</p>
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="text"
              placeholder="Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-sm border rounded px-2 py-1 w-40"
            />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="text-sm border rounded px-2 py-1 w-48"
            />
            <input
              type="number"
              min={1}
              max={12}
              value={spaces}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setSpaces(v)
              }}
              className="w-16 text-sm border rounded px-1 py-1 text-center"
              title="Spaces"
            />
            <select
              value={mode}
              onChange={e => setMode(e.target.value as 'mark_paid' | 'payment_link')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="mark_paid">Mark as paid</option>
              <option value="payment_link">Send payment link</option>
            </select>
            <button
              onClick={handleAddBooking}
              disabled={sending || !name.trim() || !email.trim()}
              className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Saving…' : 'Create'}
            </button>
            <button
              onClick={() => { setOpen(false); setMsg(null) }}
              className="text-sm px-2 py-1 rounded text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
          {msg?.text && (
            <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
          )}
        </div>
      )}
    </div>
  )
}
