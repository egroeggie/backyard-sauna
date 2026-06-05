'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function WaiverPage() {
  const { token } = useParams() as { token: string }
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [wellnessDeclaration, setWellnessDeclaration] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error' | 'already_signed'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch(`/api/waivers/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dob, email }),
    })
    if (res.status === 409) { setStatus('already_signed'); return }
    if (!res.ok) { setErrorMsg((await res.json()).error ?? 'Something went wrong.'); setStatus('error'); return }
    setStatus('done')
  }

  if (status === 'done') return (
    <main className="min-h-screen bg-[#1f3e2a] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-[#edea5a] mb-2">Waiver signed.</h1>
        <p className="text-[#edea5a] opacity-75">Check your email for confirmation. See you there.</p>
      </div>
    </main>
  )

  if (status === 'already_signed') return (
    <main className="min-h-screen bg-[#1f3e2a] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#edea5a] mb-2">Already signed.</h1>
        <p className="text-[#edea5a] opacity-75">This waiver has already been completed.</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#1f3e2a] px-4 py-12">
      <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#edea5a] mb-2">Sign your waiver</h1>
      <p className="text-[#edea5a] opacity-75 mb-6 text-sm">Each person in your group has their own link. Please complete this yourself.</p>
      <div className="border border-gray-200 rounded-lg p-4 mb-6 text-sm text-gray-900 bg-white h-64 overflow-y-auto space-y-3">
        <p className="font-semibold">Health &amp; Safety Terms — Participation Agreement</p>

        <p>By signing this waiver, you confirm that you have read, understood, and agree to all of the following terms. These terms are non-negotiable and apply to all participants without exception.</p>

        <p className="font-medium">Participation at your own risk</p>
        <p>You agree that you participate in this session entirely at your own risk. Backyard Sauna Ltd accepts no liability for any injury, illness, loss, or damage sustained as a result of your participation.</p>

        <p className="font-medium">Medical conditions — you must not participate if any of the following apply:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>You are pregnant</li>
          <li>You have had a heart attack or stroke</li>
          <li>You are taking prescription medication that may be affected by heat</li>
          <li>You have cardiovascular disease or any heart condition</li>
          <li>You have epilepsy</li>
          <li>You have asthma or any respiratory condition</li>
          <li>You have high or low blood pressure</li>
          <li>You have arterial disease</li>
          <li>You have a joint or muscle injury</li>
          <li>You have any other condition that may be worsened by heat exposure</li>
        </ul>
        <p>If you are in any doubt about your suitability to participate, you must consult your GP before attending.</p>

        <p className="font-medium">Sauna safety</p>
        <p>The sauna is wood-fired and reaches extreme temperatures. You must not touch the stove, stove door, flue, chimney, sauna rocks, or fire guards at any time. Water must only be poured onto the rocks as directed by a member of the team. Always pour from the point furthest from you to avoid scalding.</p>

        <p className="font-medium">Age and conduct</p>
        <p>You must be 18 years of age or over to participate or to be on site. No under-18s are permitted at any time. Alcohol and smoking are strictly prohibited in and around the sauna at all times. We reserve the right to refuse entry to any person who appears intoxicated. Any hanging jewellery must be removed before entering the sauna.</p>

        <p className="font-medium">Rules of participation</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Enter and exit the sauna with care.</li>
          <li>Remove shoes before entering.</li>
          <li>Sit on a towel at all times.</li>
          <li>Limit sessions to a maximum of 20 minutes (5–15 minutes is recommended).</li>
          <li>Do not use essential oils without explicit permission.</li>
          <li>Only swimwear is permitted. Nudity is not allowed.</li>
        </ul>

        <p className="font-medium">Group bookings</p>
        <p>If you have booked on behalf of a group, it is your responsibility to ensure all members of your group are aware of and agree to these terms before attending.</p>

        <p className="font-medium">Refusal of entry</p>
        <p>We reserve the right to refuse entry to any person at any time where we consider it a health and safety risk. No refund will be issued to any person refused entry on these grounds.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#edea5a] mb-1">Your full name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-transparent border border-[#edea5a] border-opacity-40 rounded-lg px-3 py-2 text-[#edea5a] placeholder-[#edea5a] placeholder-opacity-30 focus:outline-none focus:border-[#edea5a]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#edea5a] mb-1">Date of birth</label>
          <input type="date" required value={dob} onChange={e => setDob(e.target.value)}
            className="w-full bg-transparent border border-[#edea5a] border-opacity-40 rounded-lg px-3 py-2 text-[#edea5a] placeholder-[#edea5a] placeholder-opacity-30 focus:outline-none focus:border-[#edea5a]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#edea5a] mb-1">Your email address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-transparent border border-[#edea5a] border-opacity-40 rounded-lg px-3 py-2 text-[#edea5a] placeholder-[#edea5a] placeholder-opacity-30 focus:outline-none focus:border-[#edea5a]" />
        </div>
        <div className="flex items-start gap-3">
          <input type="checkbox" id="accept" required checked={accepted}
            onChange={e => setAccepted(e.target.checked)} className="mt-1 accent-[#edea5a]" />
          <label htmlFor="accept" className="text-sm text-[#edea5a] opacity-75">I have read and agree to the Health &amp; Safety Terms above in full.</label>
        </div>
        <div className="flex items-start gap-3">
          <input type="checkbox" id="wellness" required checked={wellnessDeclaration}
            onChange={e => setWellnessDeclaration(e.target.checked)} className="mt-1 accent-[#edea5a]" />
          <label htmlFor="wellness" className="text-sm text-[#edea5a] opacity-75">I confirm that I am in good health, that none of the medical conditions listed above apply to me, and that I am fit to participate in this session.</label>
        </div>
        {status === 'error' && <p className="text-[#E94560] text-sm">{errorMsg}</p>}
        <button type="submit" disabled={status === 'loading' || !accepted || !wellnessDeclaration}
          className="w-full bg-[#edea5a] text-[#1f3e2a] font-semibold py-3 rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors">
          {status === 'loading' ? 'Signing…' : 'Sign waiver'}
        </button>
      </form>
      </div>
    </main>
  )
}
