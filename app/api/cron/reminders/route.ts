import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { expirePendingBookings, getBookingsBySlotId } from '@/lib/db/bookings'
import { getWaiversByBookingId } from '@/lib/db/waivers'
import { getSlotsByEventId } from '@/lib/db/slots'
import { sendReminderEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServiceClient()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: events, error } = await sb.from('events').select('*')
    .eq('date', tomorrowStr).eq('is_published', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  let remindersSent = 0

  for (const event of events ?? []) {
    const slots = await getSlotsByEventId(event.id)
    for (const slot of slots) {
      const bookings = await getBookingsBySlotId(slot.id)
      for (const booking of bookings.filter(b => b.status === 'confirmed')) {
        const { data: existing } = await sb.from('reminder_log').select('id')
          .eq('booking_id', booking.id).single()
        if (existing) continue

        const waivers = await getWaiversByBookingId(booking.id)
        const unsignedWaiverLinks = waivers
          .filter(w => !w.signed_at)
          .map(w => `${siteUrl}/waiver/${w.token}`)

        await sendReminderEmail({
          to: booking.email, name: booking.name,
          eventTitle: event.title, eventDate: event.date,
          slotStartTime: slot.start_time, slotEndTime: slot.end_time,
          location: event.location, unsignedWaiverLinks,
        })

        await sb.from('reminder_log').insert({ booking_id: booking.id })
        remindersSent++
      }
    }
  }

  await expirePendingBookings()
  return NextResponse.json({ remindersSent })
}
