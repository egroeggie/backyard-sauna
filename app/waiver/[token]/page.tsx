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
      <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-sm text-gray-700 h-64 overflow-y-auto space-y-3">
        <p className="font-semibold">Terms and Conditions of Use</p>
        <p className="font-medium">Disclaimer</p>
        <p>Use of the sauna is done so at your own risk. We ask that you contact your GP if at all in doubt about safely using the sauna.</p>
        <p>If any of the below apply to you (please note, this is not a comprehensive list) we advise you to seek your GP&apos;s advice:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>If you&apos;re pregnant</li>
          <li>If you&apos;ve had a heart attack or stroke</li>
          <li>If you&apos;re taking any medications</li>
          <li>If you have cardiovascular conditions and/or problems</li>
          <li>You have epilepsy</li>
          <li>You have asthma or breathing conditions</li>
          <li>High or low blood pressure</li>
          <li>If you have arterial disease</li>
          <li>If you have joint or muscle injury</li>
        </ul>
        <p>The sauna is wood-fired and is extremely hot. Do not touch the stove, stove door, flue chimney, sauna rocks, or surrounding fire guards, and only pour water onto the stones as instructed.</p>
        <p>When pouring water on the rocks, start from the point furthest away from you to prevent scalding.</p>
        <p>You must be 18 years of age or over to use the sauna or to be on site. No under 18s are permitted at any time.</p>
        <p>Alcohol and smoking are not permitted in or around the sauna. We reserve the right to refuse admission to intoxicated persons.</p>
        <p>Any hanging jewellery should be removed before entering the sauna to prevent burning.</p>
        <p className="font-medium">Sauna etiquette must be adhered to at all times:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Enter and exit the sauna with care.</li>
          <li>Remove shoes before entering.</li>
          <li>Sit on a towel at all times.</li>
          <li>Stay in the sauna for no longer than 20 minutes at a time (we recommend 5–15 min sessions).</li>
          <li>Do not use essential oils in the sauna without permission.</li>
          <li>Only swimwear may be worn in the sauna. Nudity is not permitted.</li>
        </ul>
        <p>If you are making a booking on behalf of a group, it is your responsibility to make all members of your group aware of these terms and conditions.</p>
        <p>We reserve the right to refuse admission for any reason that may be deemed a health and safety risk. Refunds will not be offered to anyone refused admission.</p>
        <p className="font-medium">We accept no liability for any cold water exposure — it is done so entirely at your own risk. Consult your GP if you are unsure.</p>
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
