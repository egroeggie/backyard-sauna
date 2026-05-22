import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] pb-[90px]">
      <div className="max-w-[440px] mx-auto px-6 pt-12 flex flex-col gap-6">
        <Link href="/" className="text-[#edea5a] opacity-70 hover:opacity-100 transition-opacity">
          ←
        </Link>
        <h1 className="font-display text-[#edea5a] text-4xl text-center">About</h1>
        <div className="text-[#edea5a] font-light text-[15px] leading-relaxed text-center space-y-4">
          <p>
            Backyard Sauna is a community-led project bringing traditional sauna culture to the streets of Stockport.
          </p>
          <p>
            We host pop-up sauna events at local venues, creating a space for people to slow down, connect, and feel good — without it costing the earth.
          </p>
          <p>
            Our mission is to eventually secure a permanent site in the heart of Stockport — a social hub with traditional sauna at its core, serving the community and contributing to the growth of this beautiful part of Greater Manchester.
          </p>
          <p>
            Everyone should be able to access sauna. It shouldn't break the bank.
          </p>
        </div>
        <div className="flex justify-center">
          <img src="/polaroid.jpg" alt="The sauna" className="w-[240px] rounded-lg shadow-lg rotate-1" />
        </div>
        <Link
          href="/events"
          className="bg-[#edea5a] text-[#1f3e2a] font-semibold text-base text-center py-2 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          See upcoming events
        </Link>
      </div>
      <NavBar />
    </div>
  )
}
