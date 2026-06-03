import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBookingById, confirmBooking } from '@/lib/db/bookings'
import { createWaiverSignatures, getWaiversByBookingId } from '@/lib/db/waivers'
import { getSlotById } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { sendConfirmationEmail } from '@/lib/email'

const SITE = process.env.NEXT_PUBLIC_SITE_URL!

async function isAdmin() {
  const sb = await createClient()
  const { data: { session } } = await sb.auth.getSession()
  return !!session
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const paymentIntentId: string = body.payment_intent_id ?? ''

  try {
    const booking = await getBookingById(id)

    if (booking.status === 'confirmed') {
      return NextResponse.json({ error: 'Already confirmed' }, { status: 409 })
    }

    await confirmBooking(id, paymentIntentId)

    // Create waivers only if none exist yet (idempotent)
    const existing = await getWaiversByBookingId(id)
    const signatures = existing.length > 0
      ? existing
      : await createWaiverSignatures(id, booking.spaces)

    const slot = await getSlotById(booking.slot_id)
    const event = await getEventById(slot.event_id)

    await sendConfirmationEmail({
      to: booking.email,
      name: booking.name,
      eventTitle: event.title,
      eventDate: event.date,
      slotStartTime: slot.start_time,
      slotEndTime: slot.end_time,
      location: event.location,
      spaces: booking.spaces,
      waiverLinks: signatures.map(s => `${SITE}/waiver/${s.token}`),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/bookings/[id]/confirm]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
