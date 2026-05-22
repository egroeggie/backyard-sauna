'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
  { href: '/support', label: 'Support' },
]

export function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1f3e2a] border-t border-[#edea5a]/30 flex justify-around items-center h-[70px] px-4 z-50">
      {links.map(({ href, label }) => {
        const active = pathname === href || (href === '/events' && pathname.startsWith('/events'))
        return (
          <Link
            key={href}
            href={href}
            className={`font-display text-sm tracking-widest transition-opacity ${active ? 'text-[#edea5a] opacity-100' : 'text-[#edea5a] opacity-50'}`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
