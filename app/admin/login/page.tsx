'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/admin/events'); router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1A1A2E]">
      <div className="bg-white rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6">Backyard Sauna — Admin</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" required value={email}
            onChange={e => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          <input type="password" placeholder="Password" required value={password}
            onChange={e => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#E94560] text-white font-semibold py-2 rounded-lg disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
