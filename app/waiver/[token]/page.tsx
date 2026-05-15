'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function WaiverPage() {
  const { token } = useParams() as { token: string }
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error' | 'already_signed'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch(`/api/waivers/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })
    if (res.status === 409) { setStatus('already_signed'); return }
    if (!res.ok) { setErrorMsg((await res.json()).error ?? 'Something went wrong.'); setStatus('error'); return }
    setStatus('done')
  }

  if (status === 'done') return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Waiver signed.</h1>
      <p className="text-gray-600">Check your email for confirmation. See you there.</p>
    </main>
  )

  if (status === 'already_signed') return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Already signed.</h1>
      <p className="text-gray-600">This waiver has already been completed.</p>
    </main>
  )

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Sign your waiver</h1>
      <p className="text-gray-600 mb-6 text-sm">Each person in your group has their own link. Please complete this yourself.</p>
      <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-sm text-gray-700 h-40 overflow-y-auto">
        <p className="font-semibold mb-2">Waiver terms</p>
        <p>I understand that sauna and cold water immersion activities involve exposure to extreme temperatures and carry inherent risks including cardiovascular stress, dehydration, and dizziness. I confirm I am in good health, have no medical conditions that make participation unsafe, and take full responsibility for my participation. I agree not to consume alcohol before or during sessions and to follow all staff instructions. I release Backyard Sauna and its operators from any liability arising from my participation.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Your full name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E94560]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Your email address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E94560]" />
        </div>
        <div className="flex items-start gap-3">
          <input type="checkbox" id="accept" required checked={accepted}
            onChange={e => setAccepted(e.target.checked)} className="mt-1" />
          <label htmlFor="accept" className="text-sm text-gray-600">I have read and agree to the waiver terms above.</label>
        </div>
        {status === 'error' && <p className="text-[#E94560] text-sm">{errorMsg}</p>}
        <button type="submit" disabled={status === 'loading' || !accepted}
          className="w-full bg-[#E94560] text-white font-semibold py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
          {status === 'loading' ? 'Signing…' : 'Sign waiver'}
        </button>
      </form>
    </main>
  )
}
