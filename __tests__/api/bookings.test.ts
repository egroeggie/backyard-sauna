/**
 * @jest-environment node
 */

jest.mock('@/lib/db/bookings')
jest.mock('@/lib/db/slots')
jest.mock('@/lib/db/events')
jest.mock('@/lib/stripe')

import { POST } from '@/app/api/bookings/route'
import { createPendingBooking } from '@/lib/db/bookings'
import { getSlotById, getSlotsByEventId } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { createCheckoutSession } from '@/lib/stripe'
import { NextRequest } from 'next/server'

const SLOT_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

const mockSlot = { id: SLOT_UUID, event_id: 'event-1' }
const mockEvent = { id: 'event-1', title: 'Evening Sauna', date: '2026-06-01', price_pence: 1500, location: 'Stockport' }
const mockBooking = { id: 'booking-1', slot_id: SLOT_UUID, name: 'Alice', email: 'alice@test.com', spaces: 2, status: 'pending' }

const VALID_BODY = {
  slot_id: SLOT_UUID,
  name: 'Alice',
  email: 'alice@test.com',
  spaces: 2,
  waiver_accepted: true as const,
}

describe('POST /api/bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.backyard-sauna.com'
    ;(getSlotById as jest.Mock).mockResolvedValue(mockSlot)
    ;(getEventById as jest.Mock).mockResolvedValue(mockEvent)
    ;(getSlotsByEventId as jest.Mock).mockResolvedValue([{ ...mockSlot, available_spaces: 10 }])
    ;(createPendingBooking as jest.Mock).mockResolvedValue(mockBooking)
    ;(createCheckoutSession as jest.Mock).mockResolvedValue('https://checkout.stripe.com/pay/cs_test_xyz')
  })

  const makeRequest = (body: object) =>
    new NextRequest('http://localhost/api/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    })

  it('returns 400 on invalid email', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 on missing slot_id', async () => {
    const { slot_id: _, ...rest } = VALID_BODY
    const res = await POST(makeRequest(rest))
    expect(res.status).toBe(400)
  })

  it('returns 400 if waiver_accepted is false', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, waiver_accepted: false }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if spaces is 0', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, spaces: 0 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if spaces exceeds 12', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, spaces: 13 }))
    expect(res.status).toBe(400)
  })

  it('returns 409 if not enough spaces available', async () => {
    ;(getSlotsByEventId as jest.Mock).mockResolvedValue([{ ...mockSlot, available_spaces: 1 }])
    const res = await POST(makeRequest({ ...VALID_BODY, spaces: 2 }))
    expect(res.status).toBe(409)
  })

  it('returns checkoutUrl on success', async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_xyz')
  })

  it('calls createCheckoutSession with correct params', async () => {
    await POST(makeRequest(VALID_BODY))
    expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: 'booking-1',
      eventTitle: 'Evening Sauna',
      eventDate: '2026-06-01',
      spaces: 2,
      pricePence: 1500,
      customerEmail: 'alice@test.com',
      successUrl: expect.stringContaining('booking-1'),
      cancelUrl: expect.stringContaining('event-1'),
    }))
  })

  it('creates a pending booking before calling Stripe', async () => {
    await POST(makeRequest(VALID_BODY))
    const bookingCallOrder = (createPendingBooking as jest.Mock).mock.invocationCallOrder[0]
    const stripeCallOrder = (createCheckoutSession as jest.Mock).mock.invocationCallOrder[0]
    expect(bookingCallOrder).toBeLessThan(stripeCallOrder)
  })
})
