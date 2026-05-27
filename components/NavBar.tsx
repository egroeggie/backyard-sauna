'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/about',    label: 'About'      },
  { href: '/events',   label: 'Events'     },
  { href: '/rental',   label: 'Rental'     },
  { href: '/contact',  label: 'Contact'    },
  { href: '/support',  label: 'Support Us' },
]

export function NavBar({ inline = false }: { inline?: boolean }) {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  function isActive(href: string) {
    return pathname === href || (href === '/events' && pathname.startsWith('/events'))
  }

  const linkClass = (href: string) =>
    `font-display text-2xl text-[#edea5a] text-center leading-tight whitespace-nowrap transition duration-200 hover:opacity-100 hover:scale-105 ${isActive(href) ? 'opacity-100' : 'opacity-50'}`

  const separator = (
    <div className="h-[44px] w-[13px] relative overflow-hidden opacity-[0.23]">
      <img
        src="/nav-bar-split.png"
        alt=""
        className="absolute max-w-none"
        style={{ width: '317px', height: '240px', left: '-279px', top: '-139px' }}
      />
    </div>
  )

  // Home page: inline bottom nav
  if (inline) {
    return (
      <nav className="flex items-center justify-center gap-6 h-[70px]">
        <Link href="/about" className={linkClass('/about')}>About</Link>
        {separator}
        <Link href="/support" className={linkClass('/support')}>Support Us</Link>
        {separator}
        <Link href="/events" className={linkClass('/events')}>Events</Link>
      </nav>
    )
  }

  // Inner pages: fixed top bar (not shown on home — home uses inline above)
  if (pathname === '/') return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1f3e2a] h-14">
      <div className="w-full px-6 sm:px-10 md:px-16 h-full flex items-center justify-between gap-4">

        {/* Left: logo — links home, fills nav height */}
        <Link href="/" aria-label="Home" className="shrink-0 flex items-center">
          <img src="/cropped-mini-logo.png" alt="Backyard Sauna" className="h-9 w-auto" />
        </Link>

        {/* Right: page links */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-display text-[13px] sm:text-[15px] text-[#edea5a] whitespace-nowrap leading-none transition-opacity hover:opacity-100 hover:scale-105 ${isActive(href) ? 'opacity-100' : 'opacity-50'}`}
            >
              {label}
            </Link>
          ))}
        </div>

      </div>
    </nav>
  )
}
