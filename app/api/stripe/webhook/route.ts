import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { cancelBooking } from '@/lib/db/bookings'
import { confirmBookingAndNotify } from '@/lib/bookings/confirm'
import { revalidateTag } from 'next/cache'
import { classifySession } from '@/lib/campaign/progress'
import { CAMPAIGN_PROGRESS_TAG } from '@/lib/campaign/cached'

// Refunds and disputes change the campaign total too.
const PROGRESS_EVENTS = new Set(['charge.refunded', 'charge.dispute.closed'])

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Campaign contributions (new or legacy-tagged) aren't bookings: acknowledge them
    // and nudge the progress bar to refresh, instead of 400ing and making Stripe retry.
    if (classifySession(session)) {
      revalidateTag(CAMPAIGN_PROGRESS_TAG, 'max')
      return NextResponse.json({ received: true })
    }

    const bookingId = session.metadata?.booking_id
    if (!bookingId) return NextResponse.json({ error: 'No booking_id' }, { status: 400 })

    const paymentId = typeof session.payment_intent === 'string'
      ? session.payment_intent : session.payment_intent?.id ?? ''

    await confirmBookingAndNotify(bookingId, paymentId)
  }

  if (event.type === 'checkout.session.expired') {
    const bookingId = event.data.object.metadata?.booking_id
    if (bookingId) await cancelBooking(bookingId)
  }

  if (PROGRESS_EVENTS.has(event.type)) revalidateTag(CAMPAIGN_PROGRESS_TAG, 'max')

  return NextResponse.json({ received: true })
}
