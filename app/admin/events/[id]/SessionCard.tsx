'use client'

import { useState } from 'react'
import type { Slot } from './types'
import BookingsTable from './BookingsTable'
import AddBookingForm from './AddBookingForm'
import WalkInWaiverForm from './WalkInWaiverForm'

const fmt = (t: string) => t.slice(0, 5)

export default function SessionCard({ slot, onRemoved }: { slot: Slot; onRemoved: () => void }) {
  const pending = slot.bookings.filter(b => b.status === 'pending')
  const confirmed = slot.bookings.filter(b => b.status === 'confirmed')
  const totalBooked = confirmed.reduce((sum, b) => sum + b.spaces, 0)
  const hasActiveBookings = pending.length > 0 || confirmed.length > 0

  const [capacity, setCapacity] = useState(slot.capacity)
  const [times, setTimes] = useState({ start: fmt(slot.start_time), end: fmt(slot.end_time) })
  const [saved, setSaved] = useState({ capacity: slot.capacity, start: fmt(slot.start_time), end: fmt(slot.end_time) })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const unchanged = capacity === saved.capacity && times.start === saved.start && times.end === saved.end

  async function handleSave() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/slots/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity, start_time: times.start, end_time: times.end }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ text: typeof json.error === 'string' ? json.error : 'Error saving', ok: false })
      } else {
        setSaved({ capacity, start: times.start, end: times.end })
        setMsg({ text: 'Saved ✓', ok: true })
        setTimeout(() => setMsg(null), 2500)
      }
    } catch {
      setMsg({ text: 'Network error', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    setConfirmDelete(false)
    try {
      const res = await fetch(`/api/admin/slots/${slot.id}`, { method: 'DELETE' })
      if (res.status === 204) {
        onRemoved()
      } else {
        const json = await res.json()
        setDeleteMsg({ text: json.error ?? 'Error', ok: false })
      }
    } catch {
      setDeleteMsg({ text: 'Network error', ok: false })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1">
          <input
            type="time"
            value={times.start}
            onChange={e => setTimes(p => ({ ...p, start: e.target.value }))}
            className="text-sm border rounded px-1 py-0.5 font-semibold"
          />
          <span className="text-gray-400">–</span>
          <input
            type="time"
            value={times.end}
            onChange={e => setTimes(p => ({ ...p, end: e.target.value }))}
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
              value={capacity}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setCapacity(v)
              }}
              className="w-16 text-sm border rounded px-1 py-0.5 text-center"
            />
            <button
              onClick={handleSave}
              disabled={unchanged || saving}
              className={`text-sm px-2 py-0.5 rounded ${
                unchanged || saving
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Save
            </button>
            {deleteMsg?.text ? (
              <span className={`text-xs ${deleteMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{deleteMsg.text}</span>
            ) : confirmDelete ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Delete session?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? '…' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => hasActiveBookings
                  ? setDeleteMsg({ text: 'Cannot delete: this session has bookings', ok: false })
                  : setConfirmDelete(true)}
                className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
          {msg?.text && (
            <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</span>
          )}
        </div>
      </div>

      <BookingsTable pending={pending} confirmed={confirmed} />
      <AddBookingForm slotId={slot.id} />
      <WalkInWaiverForm eventTitle={slot.event_title} eventDate={slot.event_date} />
    </div>
  )
}
