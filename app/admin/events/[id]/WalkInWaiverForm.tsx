'use client'

import { useState } from 'react'

export default function WalkInWaiverForm({ eventTitle, eventDate }: { eventTitle: string; eventDate: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleWalkIn() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'walk_in',
          event_title: eventTitle,
          event_date: eventDate,
          email: trimmedEmail,
          name: name.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ text: json.error ?? 'Error', ok: false })
      } else {
        setMsg({ text: `Waiver sent to ${trimmedEmail} ✓`, ok: true })
        setEmail('')
        setName('')
        setOpen(false)
        setTimeout(() => setMsg({ text: '', ok: true }), 4000)
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
            + Walk-in waiver
          </button>
          {msg?.text && (
            <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">New walk-in waiver</p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Name (optional)"
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
            <button
              onClick={handleWalkIn}
              disabled={sending || !email.trim()}
              className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send waiver'}
            </button>
            <button
              onClick={() => setOpen(false)}
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
