import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getBookingById, cancelBooking } from '@/lib/db/bookings'
import { stripe } from '@/lib/stripe'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const booking = await getBookingById(id)

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 409 })
    }

    let refundId: string | null = null

    if (booking.stripe_payment_id) {
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_id,
      })
      refundId = refund.id
    }

    await cancelBooking(id)

    return NextResponse.json({ ok: true, refundId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/bookings/[id]/cancel]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
