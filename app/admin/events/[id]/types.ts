export type Waiver = { token: string; signed_at: string | null }
export type Booking = { id: string; name: string; email: string; spaces: number; status: string; stripe_payment_id: string | null; waivers: Waiver[] }
export type Slot = { id: string; start_time: string; end_time: string; capacity: number; bookings: Booking[]; event_title: string; event_date: string }
