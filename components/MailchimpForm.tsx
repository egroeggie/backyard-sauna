'use client'

import { useState } from 'react'

export function MailchimpForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage('You\'re on the list!')
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong.')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-[#edea5a] font-light text-center">{message}</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <input
        type="email"
        required
        placeholder="Your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full bg-transparent border border-[#edea5a]/50 rounded-lg px-4 py-2 text-[#edea5a] placeholder-[#edea5a]/40 focus:outline-none focus:border-[#edea5a] text-base"
      />
      {status === 'error' && <p className="text-red-400 text-sm text-center">{message}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[#edea5a] text-[#1f3e2a] font-semibold text-base text-center py-2 rounded-[10px] hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {status === 'loading' ? 'Joining…' : 'Join the mailing list'}
      </button>
    </form>
  )
}
