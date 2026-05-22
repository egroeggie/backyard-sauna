import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col items-center justify-center pb-[70px] px-6 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-[80px] border-[#edea5a]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 max-w-[440px] w-full">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[#edea5a] -translate-y-[15px]" />
          <img src="/logo.png" alt="Backyard Sauna" className="relative w-[253px] h-auto" />
        </div>
        <p className="text-[#edea5a]/80 font-light text-lg leading-relaxed">
          Community pop-up saunas in Stockport.
        </p>
        <Link
          href="/events"
          className="mt-4 bg-[#edea5a] text-[#1f3e2a] font-semibold text-base px-8 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          See upcoming events
        </Link>
      </div>

      <NavBar />
    </div>
  )
}
