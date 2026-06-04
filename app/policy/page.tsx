import { NavBar } from '@/components/NavBar'
import Link from 'next/link'

export const metadata = { title: 'Booking & Cancellation Policy — Backyard Sauna' }

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] pb-[90px]">
      <div className="max-w-[600px] mx-auto px-6 pt-12 flex flex-col gap-6">
        <Link href="/events" className="text-[#edea5a] opacity-70 hover:opacity-100 transition-opacity text-sm">← Back to events</Link>

        <h1 className="font-display text-[#edea5a] text-4xl">Booking &amp; Cancellation Policy</h1>

        <div className="flex flex-col gap-6 text-[#edea5a] font-light leading-relaxed">

          <section className="flex flex-col gap-2">
            <h2 className="text-[#edea5a] font-semibold text-lg">Bookings</h2>
            <p>All bookings are confirmed at the point of payment. You will receive a confirmation email with your booking details and individual waiver links for everyone in your group.</p>
            <p>Each person attending must sign their own waiver before arriving. Waivers must be completed in advance — unsigned waivers on the door may result in a delay or refusal of entry.</p>
            <p>Please arrive at least 15 minutes before your slot start time to allow time to get changed and checked in.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[#edea5a] font-semibold text-lg">Cancellations &amp; Refunds</h2>
            <p><strong>More than 24 hours before your slot:</strong> Full refund issued to your original payment method. Reply to your confirmation email to request a cancellation.</p>
            <p><strong>Less than 24 hours before your slot:</strong> No refund. You may transfer your booking to another person by emailing us with their name and email address.</p>
            <p><strong>No-shows:</strong> No refund will be issued for failure to attend.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[#edea5a] font-semibold text-lg">Refused Entry</h2>
            <p>We reserve the right to refuse entry to any person where we consider it a health, safety, or conduct risk — including but not limited to: intoxication, failure to comply with site rules, or a disclosed medical condition that makes participation unsafe. No refund will be issued in these circumstances.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[#edea5a] font-semibold text-lg">Event Cancellation by Us</h2>
            <p>In the unlikely event that we need to cancel a session — due to weather, equipment failure, or other circumstances beyond our control — you will receive a full refund and be notified as early as possible.</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[#edea5a] font-semibold text-lg">Contact</h2>
            <p>For any questions about your booking, email us at <a href="mailto:hello@backyard-sauna.com" className="underline hover:opacity-80">hello@backyard-sauna.com</a> or reply directly to your confirmation email.</p>
          </section>

        </div>
      </div>
      <NavBar />
    </div>
  )
}
