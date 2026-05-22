/**
 * @jest-environment node
 */

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: jest.fn() },
  },
}))
jest.mock('@/lib/db/bookings')
jest.mock('@/lib/db/waivers')
jest.mock('@/lib/db/slots')
jest.mock('@/lib/db/events')
jest.mock('@/lib/email')

import { POST } from '@/app/api/stripe/webhook/route'
import { stripe } from '@/lib/stripe'
import { confirmBooking, cancelBooking } from '@/lib/db/bookings'
import { createWaiverSignatures } from '@/lib/db/waivers'
import { getSlotById } from '@/lib/db/slots'
import { getEventById } from '@/lib/db/events'
import { sendConfirmationEmail } from '@/lib/email'
import { NextRequest } from 'next/server'

const mockConstructEvent = stripe.webhooks.constructEvent as jest.Mock

const makeRequest = (body = '{}', sig = 'valid-sig') =>
  new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': sig },
  })

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.backyard-sauna.com'
  })

  it('returns 400 on invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Bad sig') })
    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid signature')
  })

  describe('checkout.session.completed', () => {
    const session = {
      metadata: { booking_id: 'b1' },
      payment_intent: 'pi_abc123',
    }

    beforeEach(() => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: session },
      })
      ;(confirmBooking as jest.Mock).mockResolvedValue({
        id: 'b1', email: 'test@test.com', name: 'Bob', spaces: 2, slot_id: 's1',
      })
      ;(createWaiverSignatures as jest.Mock).mockResolvedValue([{ token: 'tok1' }, { token: 'tok2' }])
      ;(getSlotById as jest.Mock).mockResolvedValue({ event_id: 'e1', start_time: '10:00', end_time: '11:30' })
      ;(getEventById as jest.Mock).mockResolvedValue({ title: 'Evening Sauna', date: '2026-06-01', location: 'Stockport' })
      ;(sendConfirmationEmail as jest.Mock).mockResolvedValue(undefined)
    })

    it('returns 200 received', async () => {
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.received).toBe(true)
    })

    it('confirms the booking with the payment intent id', async () => {
      await POST(makeRequest())
      expect(confirmBooking).toHaveBeenCalledWith('b1', 'pi_abc123')
    })

    it('creates waiver signatures for the booking', async () => {
      await POST(makeRequest())
      expect(createWaiverSignatures).toHaveBeenCalledWith('b1', 2)
    })

    it('sends a confirmation email with waiver links', async () => {
      await POST(makeRequest())
      expect(sendConfirmationEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@test.com',
        name: 'Bob',
        eventTitle: 'Evening Sauna',
        waiverLinks: [
          'https://www.backyard-sauna.com/waiver/tok1',
          'https://www.backyard-sauna.com/waiver/tok2',
        ],
      }))
    })

    it('returns 400 if no booking_id in metadata', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { metadata: {}, payment_intent: 'pi_x' } },
      })
      const res = await POST(makeRequest())
      expect(res.status).toBe(400)
    })
  })

  describe('checkout.session.expired', () => {
    it('cancels the booking', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.expired',
        data: { object: { metadata: { booking_id: 'b2' } } },
      })
      ;(cancelBooking as jest.Mock).mockResolvedValue(undefined)

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(cancelBooking).toHaveBeenCalledWith('b2')
    })
  })
})
