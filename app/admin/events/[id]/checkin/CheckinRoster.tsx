'use client'

import { useState } from 'react'
import type { CheckinRoster as Roster, CheckinPerson } from '@/lib/db/waivers'

function PersonRow({
  person, checkedIn, busy, error, onToggle,
}: {
  person: CheckinPerson
  checkedIn: boolean
  busy: boolean
  error?: string
  onToggle: () => void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        disabled={busy}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
          checkedIn ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        <span className="font-medium">{person.name ?? 'Unnamed'}</span>
        <span className={`text-sm font-semibold ${checkedIn ? 'text-green-700' : 'text-gray-400'}`}>
          {busy ? '…' : checkedIn ? '✓ Arrived' : 'Tap to check in'}
        </span>
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export default function CheckinRoster({ roster }: { roster: Roster }) {
  const [search, setSearch] = useState('')
  const [checkedInAt, setCheckedInAt] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {}
    for (const slot of roster.slots) for (const p of slot.people) map[p.waiverId] = p.checkedInAt
    for (const p of roster.walkIns) map[p.waiverId] = p.checkedInAt
    return map
  })
  const [toggling, setToggling] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})

  async function toggle(waiverId: string) {
    const isCheckedIn = !!checkedInAt[waiverId]
    setToggling(p => ({ ...p, [waiverId]: true }))
    setError(p => ({ ...p, [waiverId]: '' }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isCheckedIn ? 'undo_check_in' : 'check_in', waiver_id: waiverId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(p => ({ ...p, [waiverId]: typeof json.error === 'string' ? json.error : 'Error' }))
      } else {
        setCheckedInAt(p => ({ ...p, [waiverId]: json.checked_in_at ?? null }))
      }
    } catch {
      setError(p => ({ ...p, [waiverId]: 'Network error' }))
    } finally {
      setToggling(p => ({ ...p, [waiverId]: false }))
    }
  }

  const matches = (name: string | null) =>
    !search.trim() || (name ?? '').toLowerCase().includes(search.trim().toLowerCase())

  const fmt = (t: string) => t.slice(0, 5)

  const totalPeople = roster.slots.reduce((sum, s) => sum + s.people.length, 0) + roster.walkIns.length
  const totalArrived = Object.values(checkedInAt).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1"
        />
        <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">{totalArrived}/{totalPeople} arrived</span>
      </div>

      {roster.slots.map(slot => {
        const visible = slot.people.filter(p => matches(p.name))
        if (visible.length === 0) return null
        const arrived = slot.people.filter(p => checkedInAt[p.waiverId]).length
        return (
          <div key={slot.slotId}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">{fmt(slot.startTime)} – {fmt(slot.endTime)}</h2>
              <span className="text-sm text-gray-500">{arrived}/{slot.people.length} arrived</span>
            </div>
            <div className="space-y-2">
              {visible.map(p => (
                <PersonRow
                  key={p.waiverId}
                  person={p}
                  checkedIn={!!checkedInAt[p.waiverId]}
                  busy={!!toggling[p.waiverId]}
                  error={error[p.waiverId]}
                  onToggle={() => toggle(p.waiverId)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {roster.walkIns.filter(p => matches(p.name)).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Walk-ins</h2>
            <span className="text-sm text-gray-500">
              {roster.walkIns.filter(p => checkedInAt[p.waiverId]).length}/{roster.walkIns.length} arrived
            </span>
          </div>
          <div className="space-y-2">
            {roster.walkIns.filter(p => matches(p.name)).map(p => (
              <PersonRow
                key={p.waiverId}
                person={p}
                checkedIn={!!checkedInAt[p.waiverId]}
                busy={!!toggling[p.waiverId]}
                error={error[p.waiverId]}
                onToggle={() => toggle(p.waiverId)}
              />
            ))}
          </div>
        </div>
      )}

      {totalPeople === 0 && <p className="text-gray-400 text-sm">No signed waivers for this event yet.</p>}
    </div>
  )
}
