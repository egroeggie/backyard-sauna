'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditEventPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [priceGBP, setPriceGBP] = useState('14')
  const [isPublished, setIsPublished] = useState(false)
  const [capacity, setCapacity] = useState(12)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then(r => r.json())
      .then(e => {
        setTitle(e.title)
        setDate(e.date)
        setLocation(e.location)
        setDescription(e.description)
        setPriceGBP((e.price_pence / 100).toFixed(2))
        setIsPublished(e.is_published)
        if (e.slots?.length > 0) setCapacity(e.slots[0].capacity)
        setFetching(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch(`/api/admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, date, location, description,
        price_pence: Math.round(parseFloat(priceGBP) * 100),
        is_published: isPublished, capacity,
      }),
    })
    if (!res.ok) { setError(JSON.stringify((await res.json()).error)); setLoading(false); return }
    router.push('/admin/events'); router.refresh()
  }

  if (fetching) return <p>Loading…</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit event</h1>
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
        <div className="flex items-center gap-2">
          <input type="checkbox" id="published" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
          <label htmlFor="published" className="text-sm">Published</label>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-[#E94560] text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </form>
    </div>
  )
}
