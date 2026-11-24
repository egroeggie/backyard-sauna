import type { Metadata } from 'next'
import { Inter, Dokdo } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dokdo = Dokdo({ subsets: ['latin'], weight: '400', variable: '--font-dokdo' })

export const metadata: Metadata = {
  title: 'Backyard Sauna',
  description: 'Building a permanent community sauna and ice baths in Stockport town centre. Back the campaign.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dokdo.variable} ${inter.className}`}>{children}</body>
    </html>
  )
}
