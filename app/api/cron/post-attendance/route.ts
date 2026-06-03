import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getBookingsBySlotId } from '@/lib/db/bookings'
import { getSlotsByEventId } from '@/lib/db/slots'
import { sendPostAttendanceEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServiceClient()
  const now = new Date()

  // Look at events from the past 2 days to catch all slots ending 2–26h ago
  const twoDaysAgo = new Date(now)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]

  const { data: events, error } = await sb.from('events').select('*')
    .gte('date', twoDaysAgoStr).lte('date', todayStr).eq('is_published', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let emailsSent = 0

  for (const event of events ?? []) {
    const slots = await getSlotsByEventId(event.id)

    for (const slot of slots) {
      // Combine event date + slot end_time into a full UTC datetime
      const slotEnd = new Date(`${event.date}T${slot.end_time}`)
      const hoursAgo = (now.getTime() - slotEnd.getTime()) / (1000 * 60 * 60)

      // Only send if slot ended 2–26 hours ago (cron runs hourly, 24h window with buffer)
      if (hoursAgo < 2 || hoursAgo > 26) continue

      const bookings = await getBookingsBySlotId(slot.id)

      for (const booking of bookings.filter(b => b.status === 'confirmed')) {
        const { data: existing } = await sb.from('attendance_email_log').select('id')
          .eq('booking_id', booking.id).single()
        if (existing) continue

        await sendPostAttendanceEmail({ to: booking.email, name: booking.name, eventTitle: event.title })
        await sb.from('attendance_email_log').insert({ booking_id: booking.id })
        emailsSent++
      }
    }
  }

  return NextResponse.json({ emailsSent })
}
