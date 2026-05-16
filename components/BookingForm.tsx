'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SlotWithAvailability } from '@/types'

export function BookingForm({ slots, eventId }: { slots: SlotWithAvailability[]; eventId: string }) {
  const router = useRouter()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [spaces, setSpaces] = useState(1)
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedSlot = slots.find(s => s.id === selectedSlotId)
  const fmt = (t: string) => t.slice(0, 5)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlotId) { setError('Please select a time slot.'); return }
    setLoading(true); setError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: selectedSlotId, name, email, spaces, waiver_accepted: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Something went wrong.')
        setLoading(false)
        return
      }
      if (!data.checkoutUrl) {
        setError('No payment URL returned. Please try again.')
        setLoading(false)
        return
      }
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Pick a time slot</h2>
        <div className="grid gap-2">
          {slots.map(slot => (
            <button key={slot.id} type="button"
              disabled={slot.available_spaces === 0}
              onClick={() => { setSelectedSlotId(slot.id); setSpaces(1) }}
              className={`flex justify-between items-center p-3 border rounded-lg text-left transition-colors
                ${slot.id === selectedSlotId ? 'border-[#E94560] bg-red-50' : 'border-gray-200 hover:border-gray-400'}
                ${slot.available_spaces === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span>{fmt(slot.start_time)} – {fmt(slot.end_time)}</span>
              <span className="text-sm text-gray-500">{slot.available_spaces} space{slot.available_spaces !== 1 ? 's' : ''} left</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Your name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E94560]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E94560]" />
        </div>
        {selectedSlot && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Number of spaces (max {selectedSlot.available_spaces})
            </label>
            <input type="number" min={1} max={selectedSlot.available_spaces} value={spaces}
              onChange={e => setSpaces(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E94560]" />
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="waiver" required checked={waiverAccepted}
          onChange={e => setWaiverAccepted(e.target.checked)} className="mt-1" />
        <label htmlFor="waiver" className="text-sm text-gray-600">
          I understand this involves heat exposure and accept the waiver terms.
          I will ensure everyone in my group signs their individual waiver before attending.
        </label>
      </div>

      {error && <p className="text-[#E94560] text-sm">{error}</p>}

      <button type="submit" disabled={loading || !selectedSlotId}
        className="w-full bg-[#E94560] text-white font-semibold py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
        {loading ? 'Redirecting to payment…' : 'Book now'}
      </button>
    </form>
  )
}
