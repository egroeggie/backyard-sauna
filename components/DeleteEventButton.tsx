'use client'

import { useRouter } from 'next/navigation'

export function DeleteEventButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="text-red-500 hover:underline">Delete</button>
  )
}
