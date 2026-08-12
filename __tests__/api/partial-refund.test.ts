/**
 * @jest-environment node
 */

jest.mock('@/lib/admin/auth')
jest.mock('@/lib/db/bookings')
jest.mock('@/lib/db/waivers')
jest.mock('@/lib/db/slots')
jest.mock('@/lib/db/events')
jest.mock('@/lib/stripe', () => ({
  stripe: { refunds: { create: jest.fn() } },
}))
jest.mock('@/lib/supabase/service')

import { POST } from '@/app/api/admin/bookings/[id]/partial-refund/route'
import { requireAdmin } from '@/lib/admin/auth'
import { getBookingById, reduceBookingSpaces } from '@/lib/db/bookings'
import { deleteUnsignedWaiverSignatures } from '@/lib/db/waivers'
import { getSlotById } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest } from 'next/server'

const mockBooking = {
  id: 'b1', slot_id: 's1', name: 'Alice', email: 'alice@test.com',
  spaces: 4, status: 'confirmed', stripe_payment_id: 'pi_abc123',
}

const makeRequest = (body: object) =>
  new NextRequest('http://localhost/api/admin/bookings/b1/partial-refund', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const call = (body: object) => POST(makeRequest(body), { params: Promise.resolve({ id: 'b1' }) })

describe('POST /api/admin/bookings/[id]/partial-refund', () => {
  let insertMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue(true)
    ;(getBookingById as jest.Mock).mockResolvedValue(mockBooking)
    ;(getSlotById as jest.Mock).mockResolvedValue({ id: 's1', event_id: 'e1' })
    ;(getEventById as jest.Mock).mockResolvedValue({ id: 'e1', price_pence: 1500 })
    ;(stripe.refunds.create as jest.Mock).mockResolvedValue({ id: 're_123' })
    ;(reduceBookingSpaces as jest.Mock).mockResolvedValue({ ...mockBooking, spaces: 3 })
    ;(deleteUnsignedWaiverSignatures as jest.Mock).mockResolvedValue(1)

    insertMock = jest.fn().mockResolvedValue({ error: null })
    ;(createServiceClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({ insert: insertMock }),
    })
  })

  it('returns 401 if not admin', async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue(false)
    const res = await call({ spaces: 1 })
    expect(res.status).toBe(401)
  })

  it('returns 400 on invalid body', async () => {
    const res = await call({ spaces: 0 })
    expect(res.status).toBe(400)
  })

  it('returns 409 if booking is not confirmed', async () => {
    ;(getBookingById as jest.Mock).mockResolvedValue({ ...mockBooking, status: 'pending' })
    const res = await call({ spaces: 1 })
    expect(res.status).toBe(409)
  })

  it('returns 409 if booking has no stripe_payment_id', async () => {
    ;(getBookingById as jest.Mock).mockResolvedValue({ ...mockBooking, stripe_payment_id: null })
    const res = await call({ spaces: 1 })
    expect(res.status).toBe(409)
  })

  it('returns 409 if refunding all or more spaces than the booking has', async () => {
    const res = await call({ spaces: 4 })
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.error).toMatch(/Cancel \+ refund/i)
  })

  it('calls Stripe with the amount proportional to spaces refunded', async () => {
    await call({ spaces: 1 })
    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_abc123',
      amount: 1500, // 1 space * 1500 pence
    })
  })

  it('reduces booking spaces and deletes unsigned waivers on success', async () => {
    await call({ spaces: 1 })
    expect(reduceBookingSpaces).toHaveBeenCalledWith('b1', 1)
    expect(deleteUnsignedWaiverSignatures).toHaveBeenCalledWith('b1', 1)
  })

  it('logs the refund to refund_log', async () => {
    await call({ spaces: 1 })
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      booking_id: 'b1',
      spaces_refunded: 1,
      refund_amount_pence: 1500,
      stripe_refund_id: 're_123',
    }))
  })

  it('returns waiversShortfall when fewer unsigned waivers exist than spaces refunded', async () => {
    ;(deleteUnsignedWaiverSignatures as jest.Mock).mockResolvedValue(0)
    const res = await call({ spaces: 1 })
    const data = await res.json()
    expect(data.waiversRemoved).toBe(0)
    expect(data.waiversShortfall).toBe(1)
  })

  it('returns 200 with refund details on success', async () => {
    const res = await call({ spaces: 1 })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(expect.objectContaining({
      ok: true, refundId: 're_123', newSpaces: 3, waiversRemoved: 1, waiversShortfall: 0,
    }))
  })

  it('returns a recoverable 500 with the Stripe refund id if the follow-up DB update fails after Stripe succeeds', async () => {
    ;(reduceBookingSpaces as jest.Mock).mockRejectedValue(new Error('DB down'))
    const res = await call({ spaces: 1 })
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('re_123')
    expect(data.error).toContain('DB down')
  })
})
