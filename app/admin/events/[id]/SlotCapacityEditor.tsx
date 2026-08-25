'use client'

import { useState } from 'react'
import type { Slot } from './types'
import SessionCard from './SessionCard'
import AddSessionForm from './AddSessionForm'

export default function SlotCapacityEditor({ slots, eventId }: { slots: Slot[]; eventId: string }) {
  const [removedSlotIds, setRemovedSlotIds] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-6">
      {slots.filter(slot => !removedSlotIds[slot.id]).map(slot => (
        <SessionCard
          key={slot.id}
          slot={slot}
          onRemoved={() => setRemovedSlotIds(p => ({ ...p, [slot.id]: true }))}
        />
      ))}
      <AddSessionForm eventId={eventId} />
    </div>
  )
}
