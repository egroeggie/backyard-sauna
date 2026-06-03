import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

export default function ContributeSuccessPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col items-center justify-center pb-[70px] px-6 text-center">
      <div className="max-w-[440px] w-full flex flex-col items-center gap-6">
        <div className="text-5xl">🔥</div>
        <h1 className="font-display text-[#edea5a] text-4xl">Thank you.</h1>
        <p className="text-[#edea5a] font-light">
          You&apos;re one of the early ones. Every pound gets us closer to a permanent home in Stockport.
        </p>
        <p className="text-[#edea5a] font-light opacity-70">
          Keep an eye on your inbox — we&apos;ll be in touch as the project moves forward.
        </p>
        <Link
          href="/events"
          className="mt-4 bg-[#edea5a] text-[#1f3e2a] font-semibold px-8 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          See upcoming sessions
        </Link>
      </div>
      <NavBar />
    </div>
  )
}
