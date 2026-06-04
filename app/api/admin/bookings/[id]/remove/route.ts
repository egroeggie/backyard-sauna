import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBookingById, cancelBooking } from '@/lib/db/bookings'

async function isAdmin() {
  const sb = await createClient()
  const { data: { session } } = await sb.auth.getSession()
  return !!session
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const booking = await getBookingById(id)

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 409 })
    }

    await cancelBooking(id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/bookings/[id]/remove]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
