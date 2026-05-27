import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWaiverByToken, signWaiver } from '@/lib/db/waivers'
import { getBookingById } from '@/lib/db/bookings'
import { getSlotById } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { sendWaiverConfirmationEmail } from '@/lib/email'

const schema = z.object({ name: z.string().min(1), email: z.string().email() })

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const waiver = await getWaiverByToken(token)
  if (waiver.signed_at) return NextResponse.json({ error: 'Already signed.' }, { status: 409 })

  const booking = await getBookingById(waiver.booking_id!)
  const slot = await getSlotById(booking.slot_id)
  const event = await getEventById(slot.event_id)

  const signed = await signWaiver(token, parsed.data.name, parsed.data.email, event.title, event.date)

  await sendWaiverConfirmationEmail({
    to: signed.email!, name: signed.name!, eventTitle: event.title, eventDate: event.date,
  })

  return NextResponse.json({ success: true })
}
