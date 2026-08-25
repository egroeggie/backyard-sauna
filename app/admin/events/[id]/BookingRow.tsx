'use client'

import { useState } from 'react'
import type { Booking } from './types'

export default function BookingRow({ booking }: { booking: Booking }) {
  const signed = booking.waivers.filter(w => w.signed_at).length
  const unsignedWaivers = booking.waivers.filter(w => !w.signed_at)

  // Waiver resend: keyed by waiver token (usually 1-2 per booking)
  const [resending, setResending] = useState<Record<string, boolean>>({})
  const [resendMsg, setResendMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  async function handleResend(token: string) {
    setResending(p => ({ ...p, [token]: true }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', waiver_token: token, email: booking.email, name: booking.name }),
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

  // Partial refund
  const [partialRefundOpen, setPartialRefundOpen] = useState(false)
  const [partialRefundSpaces, setPartialRefundSpaces] = useState(1)
  const [partialRefundSending, setPartialRefundSending] = useState(false)
  const [partialRefundMsg, setPartialRefundMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handlePartialRefund() {
    setPartialRefundSending(true)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/partial-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaces: partialRefundSpaces }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPartialRefundMsg({ text: typeof json.error === 'string' ? json.error : 'Error', ok: false })
      } else {
        const shortfallNote = json.waiversShortfall > 0
          ? ` (${json.waiversShortfall} signed waiver(s) still attached — void manually on the Waivers page if needed)`
          : ''
        setPartialRefundMsg({ text: `Refunded ${partialRefundSpaces} space(s) ✓ Now ${json.newSpaces}. Refresh to see it.${shortfallNote}`, ok: true })
        setPartialRefundOpen(false)
      }
    } catch {
      setPartialRefundMsg({ text: 'Network error', ok: false })
    } finally {
      setPartialRefundSending(false)
    }
  }

  // Cancel / remove
  const [cancelling, setCancelling] = useState(false)
  const [cancelMsg, setCancelMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  async function handleCancel() {
    setCancelling(true)
    setConfirmCancel(false)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/cancel`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setCancelMsg({ text: json.error ?? 'Error', ok: false })
      } else {
        setCancelMsg({ text: json.refundId ? 'Cancelled + refunded ✓' : 'Cancelled ✓', ok: true })
      }
    } catch {
      setCancelMsg({ text: 'Network error', ok: false })
    } finally {
      setCancelling(false)
    }
  }

  async function handleRemove() {
    setCancelling(true)
    setConfirmCancel(false)
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/remove`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setCancelMsg({ text: json.error ?? 'Error', ok: false })
      } else {
        setCancelMsg({ text: 'Removed (no refund) ✓', ok: true })
      }
    } catch {
      setCancelMsg({ text: 'Network error', ok: false })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <tr className="border-t">
      <td className="py-2">{booking.name}</td>
      <td className="py-2">{booking.email}</td>
      <td className="py-2">{booking.spaces}</td>
      <td className="py-2">
        <div className="flex flex-col gap-1">
          <span className={signed === booking.spaces ? 'text-green-600' : 'text-orange-500'}>
            {signed}/{booking.spaces} signed
          </span>
          {unsignedWaivers.map(w => {
            const rm = resendMsg[w.token]
            return (
              <div key={w.token} className="flex items-center gap-2">
                <button
                  onClick={() => handleResend(w.token)}
                  disabled={resending[w.token]}
                  className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                >
                  {resending[w.token] ? 'Sending…' : 'Resend waiver'}
                </button>
                {rm?.text && (
                  <span className={`text-xs ${rm.ok ? 'text-green-600' : 'text-red-600'}`}>{rm.text}</span>
                )}
              </div>
            )
          })}
        </div>
      </td>
      <td className="py-2 text-right">
        {partialRefundMsg?.text && (
          <div className="mb-1">
            <span className={`text-xs ${partialRefundMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{partialRefundMsg.text}</span>
          </div>
        )}
        {booking.stripe_payment_id && booking.spaces > 1 && (
          partialRefundOpen ? (
            <div className="flex items-center gap-1 justify-end mb-1">
              <span className="text-xs text-gray-500">Refund</span>
              <input
                type="number"
                min={1}
                max={booking.spaces - 1}
                value={partialRefundSpaces}
                onChange={e => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v)) setPartialRefundSpaces(v)
                }}
                className="w-12 text-xs border rounded px-1 py-0.5 text-center"
              />
              <span className="text-xs text-gray-500">of {booking.spaces} spaces</span>
              <button
                onClick={handlePartialRefund}
                disabled={partialRefundSending}
                className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {partialRefundSending ? '…' : 'Refund'}
              </button>
              <button
                onClick={() => setPartialRefundOpen(false)}
                className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="mb-1">
              <button
                onClick={() => { setPartialRefundOpen(true); setPartialRefundSpaces(1) }}
                className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 hover:bg-orange-100"
              >
                Partial refund
              </button>
            </div>
          )
        )}
        {cancelMsg?.text ? (
          <span className={`text-xs ${cancelMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{cancelMsg.text}</span>
        ) : confirmCancel ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500">Remove this booking?</span>
            <div className="flex items-center gap-1">
              {booking.stripe_payment_id && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? '…' : 'Cancel + refund'}
                </button>
              )}
              <button
                onClick={handleRemove}
                disabled={cancelling}
                className="text-xs px-2 py-0.5 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {cancelling ? '…' : 'Remove (no refund)'}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmCancel(true)}
            className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  )
}
