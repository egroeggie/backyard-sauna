import Link from 'next/link'

export default function BookingSuccessPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-[#1A1A2E] mb-4">You&apos;re booked in.</h1>
      <p className="text-gray-600 mb-2">Check your email — we&apos;ve sent your booking confirmation and waiver link(s).</p>
      <p className="text-gray-600 mb-8">Make sure everyone in your group signs their waiver before the day.</p>
      <Link href="/" className="text-[#E94560] underline text-sm">← Back to events</Link>
    </main>
  )
}
