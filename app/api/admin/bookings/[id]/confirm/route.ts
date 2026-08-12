import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getBookingById } from '@/lib/db/bookings'
import { confirmBookingAndNotify } from '@/lib/bookings/confirm'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const paymentIntentId: string | null = body.payment_intent_id ?? null

  try {
    const booking = await getBookingById(id)

    if (booking.status === 'confirmed') {
      return NextResponse.json({ error: 'Already confirmed' }, { status: 409 })
    }

    await confirmBookingAndNotify(id, paymentIntentId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/bookings/[id]/confirm]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
