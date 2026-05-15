import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#1A1A2E] text-white px-6 py-3 flex gap-6 text-sm items-center">
        <span className="font-semibold mr-4">Backyard Sauna Admin</span>
        <Link href="/admin/events" className="hover:underline">Events</Link>
      </nav>
      <div className="p-6">{children}</div>
    </div>
  )
}
