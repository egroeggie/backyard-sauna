'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_SLOTS = [
  { start_time: '09:00', end_time: '10:00' },
  { start_time: '10:00', end_time: '11:00' },
  { start_time: '11:00', end_time: '12:00' },
  { start_time: '12:00', end_time: '13:00' },
  { start_time: '13:00', end_time: '14:00' },
  { start_time: '14:00', end_time: '15:00' },
  { start_time: '15:00', end_time: '16:00' },
]

export default function NewEventPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [priceGBP, setPriceGBP] = useState('14')
  const [isPublished, setIsPublished] = useState(false)
  const [slots, setSlots] = useState(DEFAULT_SLOTS)
  const [capacity, setCapacity] = useState(12)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateSlot(i: number, field: 'start_time' | 'end_time', value: string) {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addSlot() {
    setSlots(prev => {
      const last = prev[prev.length - 1]
      return [...prev, { start_time: last?.end_time ?? '09:00', end_time: last?.end_time ?? '10:00' }]
    })
  }

  function removeSlot(i: number) {
    setSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, date, location, description,
        price_pence: Math.round(parseFloat(priceGBP) * 100),
        is_published: isPublished, slots, capacity,
      }),
    })
    if (!res.ok) { setError(JSON.stringify((await res.json()).error)); setLoading(false); return }
    router.push('/admin/events'); router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Location</label>
          <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Description</label>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Price per person (£)</label>
          <input type="number" required min="1" step="0.50" value={priceGBP} onChange={e => setPriceGBP(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Capacity per slot</label>
          <input type="number" required min={5} max={100} value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" /></div>

        <div>
          <h2 className="text-sm font-medium mb-2">Time slots</h2>
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-sm w-6">{i + 1}</span>
                <input type="time" value={slot.start_time} onChange={e => updateSlot(i, 'start_time', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                <span>–</span>
                <input type="time" value={slot.end_time} onChange={e => updateSlot(i, 'end_time', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                <button type="button" onClick={() => removeSlot(i)} className="text-red-500 text-sm px-2">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSlot} className="mt-2 text-sm text-blue-600 underline">+ Add slot</button>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="published" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
          <label htmlFor="published" className="text-sm">Publish immediately</label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-[#E94560] text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Creating…' : 'Create event'}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </form>
    </div>
  )
}
