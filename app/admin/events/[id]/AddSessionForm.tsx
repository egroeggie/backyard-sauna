'use client'

import { useState } from 'react'

export default function AddSessionForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [capacity, setCapacity] = useState(12)
  const [adding, setAdding] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleAddSession() {
    if (!start || !end) return
    setAdding(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, start_time: start, end_time: end, capacity }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ text: typeof json.error === 'string' ? json.error : 'Error adding session', ok: false })
      } else {
        setMsg({ text: 'Session added ✓ Refresh to see it in the list.', ok: true })
        setStart('')
        setEnd('')
        setCapacity(12)
      }
    } catch {
      setMsg({ text: 'Network error', ok: false })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          + Add session
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">New session</p>
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="time"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            />
            <span className="text-gray-400">–</span>
            <input
              type="time"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            />
            <input
              type="number"
              min={5}
              max={100}
              value={capacity}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setCapacity(v)
              }}
              className="w-16 text-sm border rounded px-1 py-1 text-center"
              title="Capacity"
            />
            <button
              onClick={handleAddSession}
              disabled={adding || !start || !end}
              className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? 'Adding…' : 'Add'}
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
