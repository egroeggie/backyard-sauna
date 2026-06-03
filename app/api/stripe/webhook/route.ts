import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { confirmBooking, cancelBooking } from '@/lib/db/bookings'
import { createWaiverSignatures } from '@/lib/db/waivers'
import { getSlotById } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  console.log('[webhook] body length:', body.length)
  console.log('[webhook] sig present:', !!sig)
  console.log('[webhook] secret prefix:', process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 12))

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] signature error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = session.metadata?.booking_id
    if (!bookingId) return NextResponse.json({ error: 'No booking_id' }, { status: 400 })

    const paymentId = typeof session.payment_intent === 'string'
      ? session.payment_intent : session.payment_intent?.id ?? ''

    const booking = await confirmBooking(bookingId, paymentId)
    const signatures = await createWaiverSignatures(bookingId, booking.spaces)
    const slot = await getSlotById(booking.slot_id)
    const eventData = await getEventById(slot.event_id)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
    await sendConfirmationEmail({
      to: booking.email,
      name: booking.name,
      eventTitle: eventData.title,
      eventDate: eventData.date,
      slotStartTime: slot.start_time,
      slotEndTime: slot.end_time,
      location: eventData.location,
      spaces: booking.spaces,
      waiverLinks: signatures.map(s => `${siteUrl}/waiver/${s.token}`),
    })
  }

  if (event.type === 'checkout.session.expired') {
    const bookingId = event.data.object.metadata?.booking_id
    if (bookingId) await cancelBooking(bookingId)
  }

  return NextResponse.json({ received: true })
}
