import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const schema = z.object({
  capacity: z.number().int().min(1).max(100),
})

async function isAdmin() {
  const sb = await createClient()
  const { data: { session } } = await sb.auth.getSession()
  return !!session
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { capacity } = parsed.data
  const sb = createServiceClient()

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

  const { data, error } = await sb.from('slots').update({ capacity }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
