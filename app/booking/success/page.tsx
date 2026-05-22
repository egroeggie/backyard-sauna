import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col items-center justify-center pb-[70px] px-6 text-center">
      <div className="max-w-[440px] w-full flex flex-col items-center gap-6">
        <div className="text-5xl">🌿</div>
        <h1 className="font-display text-[#edea5a] text-4xl">You&apos;re booked in.</h1>
        <p className="text-[#edea5a] font-light">Check your email — we&apos;ve sent your booking confirmation and waiver link(s).</p>
        <p className="text-[#edea5a] font-light">Make sure everyone in your group signs their waiver before the day.</p>
        <Link
          href="/events"
          className="mt-4 bg-[#edea5a] text-[#1f3e2a] font-semibold px-8 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          ← Back to events
        </Link>
      </div>
      <NavBar />
    </div>
  )
}
