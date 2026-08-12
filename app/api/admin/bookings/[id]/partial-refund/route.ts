import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { getBookingById, reduceBookingSpaces } from '@/lib/db/bookings'
import { deleteUnsignedWaiverSignatures } from '@/lib/db/waivers'
import { getSlotById } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe'

const schema = z.object({
  spaces: z.number().int().min(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { spaces } = parsed.data

  try {
    const booking = await getBookingById(id)

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Booking must be confirmed to issue a partial refund' }, { status: 409 })
    }
    if (!booking.stripe_payment_id) {
      return NextResponse.json({ error: 'Cannot partial-refund a booking with no Stripe payment' }, { status: 409 })
    }
    if (spaces >= booking.spaces) {
      return NextResponse.json({ error: 'Use Cancel + refund to refund the whole booking' }, { status: 409 })
    }

    const slot = await getSlotById(booking.slot_id)
    const event = await getEventById(slot.event_id)
    const refundAmountPence = event.price_pence * spaces

    const refund = await stripe.refunds.create({
      payment_intent: booking.stripe_payment_id,
      amount: refundAmountPence,
    })

    try {
      const updated = await reduceBookingSpaces(id, spaces)
      const waiversRemoved = await deleteUnsignedWaiverSignatures(id, spaces)
      const waiversShortfall = spaces - waiversRemoved

      const sb = createServiceClient()
      const { error: logErr } = await sb.from('refund_log').insert({
        booking_id: id,
        spaces_refunded: spaces,
        refund_amount_pence: refundAmountPence,
        stripe_refund_id: refund.id,
      })
      if (logErr) throw new Error(logErr.message)

      return NextResponse.json({
        ok: true,
        refundId: refund.id,
        newSpaces: updated.spaces,
        waiversRemoved,
        waiversShortfall,
      })
    } catch (postRefundErr) {
      const message = postRefundErr instanceof Error ? postRefundErr.message : 'Internal server error'
      console.error('[POST /api/admin/bookings/[id]/partial-refund] Stripe refund succeeded but follow-up failed', {
        bookingId: id, stripeRefundId: refund.id, spaces, refundAmountPence, error: postRefundErr,
      })
      return NextResponse.json({
        error: `Stripe refund ${refund.id} succeeded for £${(refundAmountPence / 100).toFixed(2)}, but updating the booking failed: ${message}. Manually verify booking ${id}'s spaces and waivers.`,
      }, { status: 500 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/bookings/[id]/partial-refund]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
