export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Event {
  id: string
  title: string
  date: string          // YYYY-MM-DD
  location: string
  description: string
  image_url: string | null
  price_pence: number
  is_published: boolean
  created_at: string
}

export interface Slot {
  id: string
  event_id: string
  start_time: string    // HH:MM:SS
  end_time: string
  capacity: number
}

export interface SlotWithAvailability extends Slot {
  available_spaces: number
}

export interface Booking {
  id: string
  slot_id: string
  name: string
  email: string
  spaces: number
  stripe_payment_id: string | null
  status: BookingStatus
  waiver_accepted: boolean
  created_at: string
}

export interface WaiverSignature {
  id: string
  booking_id: string | null
  name: string | null
  email: string | null
  token: string
  signed_at: string | null
  event_title: string | null
  event_date: string | null
}
