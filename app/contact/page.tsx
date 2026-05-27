'use client'

import { useState } from 'react'
import { NavBar } from '@/components/NavBar'

const inputClass = 'w-full bg-transparent border border-[#edea5a]/50 rounded-lg px-3 py-2 text-[#edea5a] placeholder-[#edea5a]/40 focus:outline-none focus:border-[#edea5a]'
const labelClass = 'block text-[#edea5a] text-sm font-light mb-1'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      const body = await res.json()
      setErrorMsg(body.error || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col">
      <div className="flex-1 flex flex-col justify-center w-full max-w-[440px] sm:max-w-[640px] mx-auto px-6 pt-14 pb-10 gap-10">

        <h1 className="font-display text-[#edea5a] text-[36px] leading-[50px] text-center">
          Contact
        </h1>

        {status === 'success' ? (
          <p className="text-[#edea5a] font-light text-center">
            Thanks, we&apos;ll be in touch!
          </p>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className={labelClass}>Your name</label>
              <input type="text" name="name" placeholder="Your name" required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Email address</label>
              <input type="email" name="email" placeholder="your@email.com" required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Subject</label>
              <input type="text" name="subject" placeholder="What's it about?" required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Message</label>
              <textarea
                name="message"
                rows={6}
                placeholder="Write your message here..."
                required
                className={`${inputClass} resize-none`}
              />
            </div>

            {status === 'error' && (
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-[#edea5a] text-[#1f3e2a] font-semibold text-base text-center py-3 rounded-[10px] hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
            >
              {status === 'submitting' ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}

      </div>
      <NavBar />
    </div>
  )
}
