'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SlotWithAvailability } from '@/types'

export function BookingForm({ slots, eventId }: { slots: SlotWithAvailability[]; eventId: string }) {
  const router = useRouter()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [spaces, setSpaces] = useState(1)
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [subscribe, setSubscribe] = useState(false)
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
        body: JSON.stringify({ slot_id: selectedSlotId, name, email, spaces, waiver_accepted: true, subscribe }),
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

  const inputClass = 'w-full bg-transparent border border-[#edea5a]/50 rounded-lg px-3 py-2 text-[#edea5a] placeholder-[#edea5a]/40 focus:outline-none focus:border-[#edea5a]'
  const labelClass = 'block text-[#edea5a] text-sm font-light mb-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[#edea5a] text-2xl mb-4">Pick a time slot</h2>
        <div className="flex flex-col gap-2">
          {slots.map(slot => (
            <button key={slot.id} type="button"
              disabled={slot.available_spaces === 0}
              onClick={() => { setSelectedSlotId(slot.id); setSpaces(1) }}
              className={`flex justify-between items-center p-3 border rounded-lg text-left transition-colors
                ${slot.id === selectedSlotId
                  ? 'border-[#edea5a] bg-[#edea5a]/10 text-[#edea5a]'
                  : 'border-[#edea5a]/30 text-[#edea5a]/70 hover:border-[#edea5a]/60'}
                ${slot.available_spaces === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="font-light">{fmt(slot.start_time)} – {fmt(slot.end_time)}</span>
              <span className="text-sm opacity-70">{slot.available_spaces} space{slot.available_spaces !== 1 ? 's' : ''} left</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Your name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
        </div>
        {selectedSlot && (
          <div>
            <label className={labelClass}>Number of spaces (max {selectedSlot.available_spaces})</label>
            <input type="number" min={1} max={selectedSlot.available_spaces} value={spaces}
              onChange={e => setSpaces(Number(e.target.value))} className={inputClass} />
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="subscribe" checked={subscribe}
          onChange={e => setSubscribe(e.target.checked)}
          className="mt-1 accent-[#edea5a]" />
        <label htmlFor="subscribe" className="text-sm text-[#edea5a] font-light">
          Keep me updated with future events and news from Backyard Sauna.
        </label>
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="waiver" required checked={waiverAccepted}
          onChange={e => setWaiverAccepted(e.target.checked)}
          className="mt-1 accent-[#edea5a]" />
        <label htmlFor="waiver" className="text-sm text-[#edea5a] font-light">
          I understand this involves heat exposure and accept the waiver terms.
          I will ensure everyone in my group signs their individual waiver before attending.
          I have read and agree to the{' '}
          <Link href="/policy" className="underline hover:opacity-80" target="_blank">booking &amp; cancellation policy</Link>.
        </label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading || !selectedSlotId}
        className="w-full bg-[#edea5a] text-[#1f3e2a] font-semibold py-3 rounded-[10px] hover:opacity-90 disabled:opacity-40 transition-opacity">
        {loading ? 'Redirecting to payment…' : 'Book now'}
      </button>
    </form>
  )
}
