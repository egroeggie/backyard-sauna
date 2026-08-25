'use client'

import { useState } from 'react'
import type { Booking } from './types'

export default function PendingBookingRow({ booking }: { booking: Booking }) {
  const [confirming, setConfirming] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleConfirm() {
    setConfirming(true)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/confirm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ text: json.error ?? 'Error', ok: false })
      } else {
        setMsg({ text: 'Confirmed + email sent ✓', ok: true })
      }
    } catch {
      setMsg({ text: 'Network error', ok: false })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <tr className="border-t">
      <td className="py-2">{booking.name}</td>
      <td className="py-2">{booking.email}</td>
      <td className="py-2">{booking.spaces}</td>
      <td className="py-2 text-right">
        {msg?.text ? (
          <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="text-xs px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {confirming ? 'Confirming…' : 'Confirm & send email'}
          </button>
        )}
      </td>
    </tr>
  )
}
