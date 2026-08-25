import type { Booking } from './types'
import PendingBookingRow from './PendingBookingRow'
import BookingRow from './BookingRow'

export default function BookingsTable({ pending, confirmed }: { pending: Booking[]; confirmed: Booking[] }) {
  return (
    <>
      {pending.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Pending (unpaid)</p>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500">
              <th className="pb-2">Name</th><th className="pb-2">Email</th>
              <th className="pb-2">Spaces</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {pending.map(b => <PendingBookingRow key={b.id} booking={b} />)}
            </tbody>
          </table>
        </div>
      )}

      {confirmed.length === 0 ? <p className="text-gray-400 text-sm">No bookings yet.</p> : (
        <table className="w-full text-sm mb-4">
          <thead><tr className="text-left text-gray-500">
            <th className="pb-2">Name</th><th className="pb-2">Email</th>
            <th className="pb-2">Spaces</th><th className="pb-2">Waivers</th>
            <th className="pb-2"></th>
          </tr></thead>
          <tbody>
            {confirmed.map(b => <BookingRow key={b.id} booking={b} />)}
          </tbody>
        </table>
      )}
    </>
  )
}
