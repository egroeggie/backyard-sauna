import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createPendingBooking } from '@/lib/db/bookings'
import { confirmBookingAndNotify } from '@/lib/bookings/confirm'
import { getSlotById, getSlotsByEventId } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { createCheckoutSession } from '@/lib/stripe'
import { sendPaymentLinkEmail } from '@/lib/email'

const schema = z.object({
  slot_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  spaces: z.number().int().min(1).max(12),
  mode: z.enum(['mark_paid', 'payment_link']),
})

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { slot_id, name, email, spaces, mode } = parsed.data

  try {
    const slot = await getSlotById(slot_id)
    const event = await getEventById(slot.event_id)

    const slotsWithAvailability = await getSlotsByEventId(slot.event_id)
    const slotAvail = slotsWithAvailability.find(s => s.id === slot_id)
    if (!slotAvail || slotAvail.available_spaces < spaces) {
      return NextResponse.json({ error: 'Not enough spaces available' }, { status: 409 })
    }

    const booking = await createPendingBooking({ slot_id, name, email, spaces, waiver_accepted: true })

    if (mode === 'mark_paid') {
      await confirmBookingAndNotify(booking.id, null)
      return NextResponse.json({ ok: true, mode })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
    const checkoutUrl = await createCheckoutSession({
      bookingId: booking.id,
      eventTitle: event.title,
      eventDate: event.date,
      spaces,
      pricePence: event.price_pence,
      customerEmail: email,
      successUrl: `${siteUrl}/booking/success?booking_id=${booking.id}`,
      cancelUrl: `${siteUrl}/events/${event.id}`,
    })

    await sendPaymentLinkEmail({ to: email, name, eventTitle: event.title, eventDate: event.date, spaces, checkoutUrl })

    return NextResponse.json({ ok: true, mode, checkoutUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/bookings]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
