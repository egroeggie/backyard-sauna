'use client'

import { useState } from 'react'

type Waiver = { token: string; signed_at: string | null }
type Booking = { id: string; name: string; email: string; spaces: number; status: string; stripe_payment_id: string | null; waivers: Waiver[] }
type Slot = { id: string; start_time: string; end_time: string; capacity: number; bookings: Booking[]; event_title: string; event_date: string }

export default function SlotCapacityEditor({ slots, eventId }: { slots: Slot[]; eventId: string }) {
  const fmt = (t: string) => t.slice(0, 5)

  const [capacities, setCapacities] = useState<Record<string, number>>(
    Object.fromEntries(slots.map(s => [s.id, s.capacity]))
  )
  const [times, setTimes] = useState<Record<string, { start: string; end: string }>>(
    Object.fromEntries(slots.map(s => [s.id, { start: fmt(s.start_time), end: fmt(s.end_time) }]))
  )
  const [saved, setSaved] = useState<Record<string, { capacity: number; start: string; end: string }>>(
    Object.fromEntries(slots.map(s => [s.id, { capacity: s.capacity, start: fmt(s.start_time), end: fmt(s.end_time) }]))
  )
  const [messages, setMessages] = useState<Record<string, { text: string; ok: boolean }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  // Delete session state: keyed by slot id
  const [deletingSlot, setDeletingSlot] = useState<Record<string, boolean>>({})
  const [deleteSlotMsg, setDeleteSlotMsg] = useState<Record<string, { text: string; ok: boolean }>>({})
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<Record<string, boolean>>({})
  const [removedSlots, setRemovedSlots] = useState<Record<string, boolean>>({})

  // Add session state
  const [addSessionOpen, setAddSessionOpen] = useState(false)
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [newCapacity, setNewCapacity] = useState(12)
  const [addingSession, setAddingSession] = useState(false)
  const [addSessionMsg, setAddSessionMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleAddSession() {
    if (!newStart || !newEnd) return
    setAddingSession(true)
    setAddSessionMsg(null)
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, start_time: newStart, end_time: newEnd, capacity: newCapacity }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddSessionMsg({ text: typeof json.error === 'string' ? json.error : 'Error adding session', ok: false })
      } else {
        setAddSessionMsg({ text: 'Session added ✓ Refresh to see it in the list.', ok: true })
        setNewStart('')
        setNewEnd('')
        setNewCapacity(12)
      }
    } catch {
      setAddSessionMsg({ text: 'Network error', ok: false })
    } finally {
      setAddingSession(false)
    }
  }

  async function handleDeleteSlot(slotId: string) {
    setDeletingSlot(p => ({ ...p, [slotId]: true }))
    setConfirmDeleteSlot(p => ({ ...p, [slotId]: false }))
    try {
      const res = await fetch(`/api/admin/slots/${slotId}`, { method: 'DELETE' })
      if (res.status === 204) {
        setRemovedSlots(p => ({ ...p, [slotId]: true }))
      } else {
        const json = await res.json()
        setDeleteSlotMsg(p => ({ ...p, [slotId]: { text: json.error ?? 'Error', ok: false } }))
      }
    } catch {
      setDeleteSlotMsg(p => ({ ...p, [slotId]: { text: 'Network error', ok: false } }))
    } finally {
      setDeletingSlot(p => ({ ...p, [slotId]: false }))
    }
  }

  // Waiver resend state: keyed by waiver token
  const [resending, setResending] = useState<Record<string, boolean>>({})
  const [resendMsg, setResendMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  // Confirm booking state: keyed by booking id
  const [confirmingBooking, setConfirmingBooking] = useState<Record<string, boolean>>({})
  const [confirmBookingMsg, setConfirmBookingMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  async function handleConfirm(bookingId: string) {
    setConfirmingBooking(p => ({ ...p, [bookingId]: true }))
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (!res.ok) {
        setConfirmBookingMsg(p => ({ ...p, [bookingId]: { text: json.error ?? 'Error', ok: false } }))
      } else {
        setConfirmBookingMsg(p => ({ ...p, [bookingId]: { text: 'Confirmed + email sent ✓', ok: true } }))
      }
    } catch {
      setConfirmBookingMsg(p => ({ ...p, [bookingId]: { text: 'Network error', ok: false } }))
    } finally {
      setConfirmingBooking(p => ({ ...p, [bookingId]: false }))
    }
  }

  // Cancel booking state: keyed by booking id
  const [cancelling, setCancelling] = useState<Record<string, boolean>>({})
  const [cancelMsg, setCancelMsg] = useState<Record<string, { text: string; ok: boolean }>>({})
  const [confirmCancel, setConfirmCancel] = useState<Record<string, boolean>>({})

  // Partial refund state: keyed by booking id
  const [partialRefundOpen, setPartialRefundOpen] = useState<Record<string, boolean>>({})
  const [partialRefundSpaces, setPartialRefundSpaces] = useState<Record<string, number>>({})
  const [partialRefundSending, setPartialRefundSending] = useState<Record<string, boolean>>({})
  const [partialRefundMsg, setPartialRefundMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  async function handlePartialRefund(bookingId: string) {
    const spaces = partialRefundSpaces[bookingId] ?? 1
    setPartialRefundSending(p => ({ ...p, [bookingId]: true }))
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/partial-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaces }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPartialRefundMsg(p => ({ ...p, [bookingId]: { text: typeof json.error === 'string' ? json.error : 'Error', ok: false } }))
      } else {
        const shortfallNote = json.waiversShortfall > 0
          ? ` (${json.waiversShortfall} signed waiver(s) still attached — void manually on the Waivers page if needed)`
          : ''
        setPartialRefundMsg(p => ({
          ...p,
          [bookingId]: { text: `Refunded ${spaces} space(s) ✓ Now ${json.newSpaces}. Refresh to see it.${shortfallNote}`, ok: true },
        }))
        setPartialRefundOpen(p => ({ ...p, [bookingId]: false }))
      }
    } catch {
      setPartialRefundMsg(p => ({ ...p, [bookingId]: { text: 'Network error', ok: false } }))
    } finally {
      setPartialRefundSending(p => ({ ...p, [bookingId]: false }))
    }
  }

  async function handleCancel(bookingId: string) {
    setCancelling(p => ({ ...p, [bookingId]: true }))
    setConfirmCancel(p => ({ ...p, [bookingId]: false }))
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setCancelMsg(p => ({ ...p, [bookingId]: { text: json.error ?? 'Error', ok: false } }))
      } else {
        setCancelMsg(p => ({ ...p, [bookingId]: { text: json.refundId ? 'Cancelled + refunded ✓' : 'Cancelled ✓', ok: true } }))
      }
    } catch {
      setCancelMsg(p => ({ ...p, [bookingId]: { text: 'Network error', ok: false } }))
    } finally {
      setCancelling(p => ({ ...p, [bookingId]: false }))
    }
  }

  async function handleRemove(bookingId: string) {
    setCancelling(p => ({ ...p, [bookingId]: true }))
    setConfirmCancel(p => ({ ...p, [bookingId]: false }))
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/remove`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setCancelMsg(p => ({ ...p, [bookingId]: { text: json.error ?? 'Error', ok: false } }))
      } else {
        setCancelMsg(p => ({ ...p, [bookingId]: { text: 'Removed (no refund) ✓', ok: true } }))
      }
    } catch {
      setCancelMsg(p => ({ ...p, [bookingId]: { text: 'Network error', ok: false } }))
    } finally {
      setCancelling(p => ({ ...p, [bookingId]: false }))
    }
  }

  // Admin create-booking state: keyed by slot id
  const [addBookingOpen, setAddBookingOpen] = useState<Record<string, boolean>>({})
  const [addBookingName, setAddBookingName] = useState<Record<string, string>>({})
  const [addBookingEmail, setAddBookingEmail] = useState<Record<string, string>>({})
  const [addBookingSpaces, setAddBookingSpaces] = useState<Record<string, number>>({})
  const [addBookingMode, setAddBookingMode] = useState<Record<string, 'mark_paid' | 'payment_link'>>({})
  const [addBookingSending, setAddBookingSending] = useState<Record<string, boolean>>({})
  const [addBookingMsg, setAddBookingMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  async function handleAddBooking(slotId: string) {
    const name = addBookingName[slotId]?.trim()
    const email = addBookingEmail[slotId]?.trim()
    const spaces = addBookingSpaces[slotId] ?? 1
    const mode = addBookingMode[slotId] ?? 'mark_paid'
    if (!name || !email) return
    setAddBookingSending(p => ({ ...p, [slotId]: true }))
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, name, email, spaces, mode }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddBookingMsg(p => ({ ...p, [slotId]: { text: typeof json.error === 'string' ? json.error : 'Error', ok: false } }))
      } else {
        setAddBookingMsg(p => ({
          ...p,
          [slotId]: {
            text: mode === 'mark_paid' ? 'Booked & confirmed ✓ Refresh to see it.' : 'Payment link emailed ✓',
            ok: true,
          },
        }))
        setAddBookingName(p => ({ ...p, [slotId]: '' }))
        setAddBookingEmail(p => ({ ...p, [slotId]: '' }))
        setAddBookingSpaces(p => ({ ...p, [slotId]: 1 }))
      }
    } catch {
      setAddBookingMsg(p => ({ ...p, [slotId]: { text: 'Network error', ok: false } }))
    } finally {
      setAddBookingSending(p => ({ ...p, [slotId]: false }))
    }
  }

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
        body: JSON.stringify({
          capacity: capacities[slotId],
          start_time: times[slotId].start,
          end_time: times[slotId].end,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessages(p => ({ ...p, [slotId]: { text: typeof json.error === 'string' ? json.error : 'Error saving', ok: false } }))
      } else {
        setSaved(p => ({ ...p, [slotId]: { capacity: capacities[slotId], start: times[slotId].start, end: times[slotId].end } }))
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
      {slots.filter(slot => !removedSlots[slot.id]).map(slot => {
        const pending = slot.bookings.filter(b => b.status === 'pending')
        const confirmed = slot.bookings.filter(b => b.status === 'confirmed')
        const totalBooked = confirmed.reduce((sum, b) => sum + b.spaces, 0)
        const currentCap = capacities[slot.id]
        const currentTimes = times[slot.id]
        const unchanged = currentCap === saved[slot.id].capacity
          && currentTimes.start === saved[slot.id].start
          && currentTimes.end === saved[slot.id].end
        const msg = messages[slot.id]
        const wiMsg = walkInMsg[slot.id]
        const hasActiveBookings = pending.length > 0 || confirmed.length > 0
        const delMsg = deleteSlotMsg[slot.id]

        return (
          <div key={slot.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={currentTimes.start}
                  onChange={e => setTimes(p => ({ ...p, [slot.id]: { ...p[slot.id], start: e.target.value } }))}
                  className="text-sm border rounded px-1 py-0.5 font-semibold"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  value={currentTimes.end}
                  onChange={e => setTimes(p => ({ ...p, [slot.id]: { ...p[slot.id], end: e.target.value } }))}
                  className="text-sm border rounded px-1 py-0.5 font-semibold"
                />
              </div>
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
                  {delMsg?.text ? (
                    <span className={`text-xs ${delMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{delMsg.text}</span>
                  ) : confirmDeleteSlot[slot.id] ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Delete session?</span>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deletingSlot[slot.id]}
                        className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingSlot[slot.id] ? '…' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteSlot(p => ({ ...p, [slot.id]: false }))}
                        className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => hasActiveBookings
                        ? setDeleteSlotMsg(p => ({ ...p, [slot.id]: { text: 'Cannot delete: this session has bookings', ok: false } }))
                        : setConfirmDeleteSlot(p => ({ ...p, [slot.id]: true }))}
                      className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {msg?.text && (
                  <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
                    {msg.text}
                  </span>
                )}
              </div>
            </div>

            {pending.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Pending (unpaid)</p>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500">
                    <th className="pb-2">Name</th><th className="pb-2">Email</th>
                    <th className="pb-2">Spaces</th><th className="pb-2"></th>
                  </tr></thead>
                  <tbody>
                    {pending.map(b => (
                      <tr key={b.id} className="border-t">
                        <td className="py-2">{b.name}</td>
                        <td className="py-2">{b.email}</td>
                        <td className="py-2">{b.spaces}</td>
                        <td className="py-2 text-right">
                          {confirmBookingMsg[b.id]?.text ? (
                            <span className={`text-xs ${confirmBookingMsg[b.id].ok ? 'text-green-600' : 'text-red-600'}`}>
                              {confirmBookingMsg[b.id].text}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConfirm(b.id)}
                              disabled={confirmingBooking[b.id]}
                              className="text-xs px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {confirmingBooking[b.id] ? 'Confirming…' : 'Confirm & send email'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {confirmed.length === 0 ? <p className="text-gray-400 text-sm">No bookings yet.</p> : (
              <table className="w-full text-sm mb-4">
                <thead><tr className="text-left text-gray-500">
                  <th className="pb-2">Name</th><th className="pb-2">Email</th>
                  <th className="pb-2">Spaces</th><th className="pb-2">Waivers</th>
                  <th className="pb-2"></th>
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
                        <td className="py-2 text-right">
                          {partialRefundMsg[b.id]?.text && (
                            <div className="mb-1">
                              <span className={`text-xs ${partialRefundMsg[b.id].ok ? 'text-green-600' : 'text-red-600'}`}>
                                {partialRefundMsg[b.id].text}
                              </span>
                            </div>
                          )}
                          {b.stripe_payment_id && b.spaces > 1 && (
                            partialRefundOpen[b.id] ? (
                              <div className="flex items-center gap-1 justify-end mb-1">
                                <span className="text-xs text-gray-500">Refund</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={b.spaces - 1}
                                  value={partialRefundSpaces[b.id] ?? 1}
                                  onChange={e => {
                                    const v = parseInt(e.target.value, 10)
                                    if (!isNaN(v)) setPartialRefundSpaces(p => ({ ...p, [b.id]: v }))
                                  }}
                                  className="w-12 text-xs border rounded px-1 py-0.5 text-center"
                                />
                                <span className="text-xs text-gray-500">of {b.spaces} spaces</span>
                                <button
                                  onClick={() => handlePartialRefund(b.id)}
                                  disabled={partialRefundSending[b.id]}
                                  className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {partialRefundSending[b.id] ? '…' : 'Refund'}
                                </button>
                                <button
                                  onClick={() => setPartialRefundOpen(p => ({ ...p, [b.id]: false }))}
                                  className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="mb-1">
                                <button
                                  onClick={() => {
                                    setPartialRefundOpen(p => ({ ...p, [b.id]: true }))
                                    setPartialRefundSpaces(p => ({ ...p, [b.id]: 1 }))
                                  }}
                                  className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 hover:bg-orange-100"
                                >
                                  Partial refund
                                </button>
                              </div>
                            )
                          )}
                          {cancelMsg[b.id]?.text ? (
                            <span className={`text-xs ${cancelMsg[b.id].ok ? 'text-green-600' : 'text-red-600'}`}>
                              {cancelMsg[b.id].text}
                            </span>
                          ) : confirmCancel[b.id] ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-500">Remove this booking?</span>
                              <div className="flex items-center gap-1">
                                {b.stripe_payment_id && (
                                  <button
                                    onClick={() => handleCancel(b.id)}
                                    disabled={cancelling[b.id]}
                                    className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {cancelling[b.id] ? '…' : 'Cancel + refund'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemove(b.id)}
                                  disabled={cancelling[b.id]}
                                  className="text-xs px-2 py-0.5 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                                >
                                  {cancelling[b.id] ? '…' : 'Remove (no refund)'}
                                </button>
                                <button
                                  onClick={() => setConfirmCancel(p => ({ ...p, [b.id]: false }))}
                                  className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmCancel(p => ({ ...p, [b.id]: true }))}
                              className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Admin create booking */}
            <div className="border-t pt-3 mt-1">
              {!addBookingOpen[slot.id] ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAddBookingOpen(p => ({ ...p, [slot.id]: true }))}
                    className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    + Add booking
                  </button>
                  {addBookingMsg[slot.id]?.text && (
                    <span className={`text-xs ${addBookingMsg[slot.id].ok ? 'text-green-600' : 'text-red-600'}`}>
                      {addBookingMsg[slot.id].text}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">New booking</p>
                  <div className="flex gap-2 flex-wrap items-center">
                    <input
                      type="text"
                      placeholder="Name *"
                      value={addBookingName[slot.id] ?? ''}
                      onChange={e => setAddBookingName(p => ({ ...p, [slot.id]: e.target.value }))}
                      className="text-sm border rounded px-2 py-1 w-40"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={addBookingEmail[slot.id] ?? ''}
                      onChange={e => setAddBookingEmail(p => ({ ...p, [slot.id]: e.target.value }))}
                      className="text-sm border rounded px-2 py-1 w-48"
                    />
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={addBookingSpaces[slot.id] ?? 1}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10)
                        if (!isNaN(v)) setAddBookingSpaces(p => ({ ...p, [slot.id]: v }))
                      }}
                      className="w-16 text-sm border rounded px-1 py-1 text-center"
                      title="Spaces"
                    />
                    <select
                      value={addBookingMode[slot.id] ?? 'mark_paid'}
                      onChange={e => setAddBookingMode(p => ({ ...p, [slot.id]: e.target.value as 'mark_paid' | 'payment_link' }))}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="mark_paid">Mark as paid</option>
                      <option value="payment_link">Send payment link</option>
                    </select>
                    <button
                      onClick={() => handleAddBooking(slot.id)}
                      disabled={addBookingSending[slot.id] || !addBookingName[slot.id]?.trim() || !addBookingEmail[slot.id]?.trim()}
                      className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {addBookingSending[slot.id] ? 'Saving…' : 'Create'}
                    </button>
                    <button
                      onClick={() => { setAddBookingOpen(p => ({ ...p, [slot.id]: false })); setAddBookingMsg(p => ({ ...p, [slot.id]: { text: '', ok: true } })) }}
                      className="text-sm px-2 py-1 rounded text-gray-500 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                  {addBookingMsg[slot.id]?.text && (
                    <span className={`text-xs ${addBookingMsg[slot.id].ok ? 'text-green-600' : 'text-red-600'}`}>
                      {addBookingMsg[slot.id].text}
                    </span>
                  )}
                </div>
              )}
            </div>

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

      <div className="border rounded-lg p-4">
        {!addSessionOpen ? (
          <button
            onClick={() => setAddSessionOpen(true)}
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
                value={newStart}
                onChange={e => setNewStart(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              />
              <span className="text-gray-400">–</span>
              <input
                type="time"
                value={newEnd}
                onChange={e => setNewEnd(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              />
              <input
                type="number"
                min={5}
                max={100}
                value={newCapacity}
                onChange={e => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v)) setNewCapacity(v)
                }}
                className="w-16 text-sm border rounded px-1 py-1 text-center"
                title="Capacity"
              />
              <button
                onClick={handleAddSession}
                disabled={addingSession || !newStart || !newEnd}
                className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addingSession ? 'Adding…' : 'Add'}
              </button>
              <button
                onClick={() => { setAddSessionOpen(false); setAddSessionMsg(null) }}
                className="text-sm px-2 py-1 rounded text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
            {addSessionMsg?.text && (
              <span className={`text-xs ${addSessionMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                {addSessionMsg.text}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
