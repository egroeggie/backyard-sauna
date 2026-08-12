import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { updateSlot, deleteSlot } from '@/lib/db/slots'
import { getBookingsBySlotId } from '@/lib/db/bookings'

const schema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  capacity: z.number().int().min(5).max(100).optional(),
}).refine(v => v.start_time !== undefined || v.end_time !== undefined || v.capacity !== undefined, {
  message: 'At least one of start_time, end_time, capacity is required',
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { capacity, ...updates } = parsed.data
  const sb = createServiceClient()

  if (capacity !== undefined) {
    const { data: bookings, error: bErr } = await sb.from('bookings')
      .select('spaces')
      .eq('slot_id', id)
      .eq('status', 'confirmed')
    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

    const totalBooked = (bookings ?? []).reduce((sum, b) => sum + b.spaces, 0)
    if (capacity < totalBooked) {
      return NextResponse.json(
        { error: `Cannot set capacity below confirmed bookings (${totalBooked} spaces already booked)` },
        { status: 409 }
      )
    }
  }

  try {
    const data = await updateSlot(id, { ...updates, ...(capacity !== undefined ? { capacity } : {}) })
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const bookings = await getBookingsBySlotId(id)
    const active = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
    if (active.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete session with ${active.length} active booking(s)` },
        { status: 409 }
      )
    }

    await deleteSlot(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
