import { confirmBooking } from '@/lib/db/bookings'
import { createWaiverSignatures, getWaiversByBookingId } from '@/lib/db/waivers'
import { getSlotById } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { sendConfirmationEmail } from '@/lib/email'
import type { Booking, WaiverSignature } from '@/types'

const SITE = process.env.NEXT_PUBLIC_SITE_URL!

export async function confirmBookingAndNotify(
  bookingId: string,
  stripePaymentId: string | null
): Promise<{ booking: Booking; signatures: WaiverSignature[] }> {
  const booking = await confirmBooking(bookingId, stripePaymentId)

  const existing = await getWaiversByBookingId(bookingId)
  const signatures = existing.length > 0 ? existing : await createWaiverSignatures(bookingId, booking.spaces)

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

  return { booking, signatures }
}
