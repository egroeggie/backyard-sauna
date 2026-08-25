'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function EventActions({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function toggleArchive() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !archived }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(typeof json.error === 'string' ? json.error : 'Error')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    setError('')
    setConfirmDelete(false)
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
      if (res.status === 204) {
        router.refresh()
      } else {
        const json = await res.json().catch(() => ({}))
        setError(typeof json.error === 'string' ? json.error : 'Error')
      }
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-3 items-center">
        <button onClick={toggleArchive} disabled={busy} className="text-gray-600 hover:underline disabled:opacity-50">
          {archived ? 'Unarchive' : 'Archive'}
        </button>
        {confirmDelete ? (
          <span className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Delete?</span>
            <button onClick={handleDelete} disabled={busy} className="text-red-600 font-medium hover:underline disabled:opacity-50">
              Yes
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-gray-500 hover:underline">No</button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} disabled={busy} className="text-red-500 hover:underline disabled:opacity-50">
            Delete
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
