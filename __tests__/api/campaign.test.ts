/**
 * @jest-environment node
 */
jest.mock('next/cache', () => ({
  unstable_cache: (fn: () => unknown) => fn,
  revalidateTag: jest.fn(),
}))
jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { list: jest.fn(), create: jest.fn() } },
    prices: { list: jest.fn() },
  },
}))

import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { GET } from '@/app/api/campaign-progress/route'
import { POST as contribute } from '@/app/api/contribute/route'
import { POST as book } from '@/app/api/bookings/route'

const mockList = stripe.checkout.sessions.list as jest.Mock
const mockCreate = stripe.checkout.sessions.create as jest.Mock
const mockPrices = stripe.prices.list as jest.Mock

const paid = (amount: number, md: Record<string, string>, email: string) => ({
  id: `cs_${email}_${amount}`, created: 1790000000, currency: 'gbp', status: 'complete', payment_status: 'paid',
  amount_total: amount, metadata: md, customer_details: { email }, customer_email: email,
  payment_intent: { id: 'pi', status: 'succeeded', latest_charge: { id: 'ch', status: 'succeeded', amount, amount_refunded: 0, currency: 'gbp' } },
})

describe('GET /api/campaign-progress', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns totals with a cache header', async () => {
    mockList.mockReturnValue({ autoPagingToArray: jest.fn().mockResolvedValue([
      paid(10000, { campaign: 'permanent-venue', tier: 'true-believer' }, 'a@x.com'),
      paid(1500, { tier_name: 'Warm up' }, 'b@x.com'),
      paid(3000, { booking_id: 'b1' }, 'c@x.com'),
    ]) })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('s-maxage=300')
    const body = await res.json()
    expect(body).toMatchObject({ raised: 115, backers: 2, primaryTarget: 30000 })
    expect(body.milestones).toHaveLength(3)
    expect(body.updatedAt).toBeDefined()
  })

  it('serves the last good value when Stripe fails afterwards', async () => {
    mockList.mockReturnValue({ autoPagingToArray: jest.fn().mockResolvedValue([paid(2000, { campaign: 'permanent-venue' }, 'a@x.com')]) })
    await GET()
    mockList.mockReturnValue({ autoPagingToArray: jest.fn().mockRejectedValue(new Error('Stripe down')) })
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await GET()
    errSpy.mockRestore()
    expect(res.status).toBe(200)
    expect((await res.json()).raised).toBe(20)
  })
})

describe('POST /api/contribute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/c/test' })
  })
  const req = (body: object) => new NextRequest('http://localhost/api/contribute', { method: 'POST', body: JSON.stringify(body) })

  it('uses the tier price found by lookup key and tags the session and payment', async () => {
    mockPrices.mockResolvedValue({ data: [{ id: 'price_warm', unit_amount: 2000, currency: 'gbp', product: 'prod_warm' }] })
    const res = await contribute(req({ tier_id: 'warm-up', email: 'sam@example.com', wall_name: 'Sam', amount_pence: 1 }))
    expect(res.status).toBe(200)
    expect(mockPrices).toHaveBeenCalledWith(expect.objectContaining({ lookup_keys: ['permanent-venue:warm-up'], active: true }))
    const args = mockCreate.mock.calls[0][0]
    expect(args.line_items).toEqual([{ price: 'price_warm', quantity: 1 }]) // client amount ignored for fixed tiers
    expect(args.metadata).toMatchObject({ campaign: 'permanent-venue', tier: 'warm-up', wall_name: 'Sam', anonymous: 'false' })
    expect(args.payment_intent_data.metadata).toEqual(args.metadata)
    expect(args.customer_email).toBe('sam@example.com')
  })

  it('custom amounts use price_data on the campaign custom product, minimum £1', async () => {
    mockPrices.mockResolvedValue({ data: [{ id: 'price_custom', unit_amount: null, currency: 'gbp', product: 'prod_custom' }] })
    expect((await contribute(req({ tier_id: 'custom', email: 'a@b.com', anonymous: true, amount_pence: 99 }))).status).toBe(400)
    const res = await contribute(req({ tier_id: 'custom', email: 'a@b.com', anonymous: true, amount_pence: 1234 }))
    expect(res.status).toBe(200)
    expect(mockCreate.mock.calls[0][0].line_items[0].price_data).toEqual({ currency: 'gbp', product: 'prod_custom', unit_amount: 1234 })
    expect(mockCreate.mock.calls[0][0].metadata).toMatchObject({ anonymous: 'true', wall_name: '' })
  })

  it('Firekeeper requires a business name and flags the logo for follow-up', async () => {
    mockPrices.mockResolvedValue({ data: [{ id: 'price_fk', unit_amount: 50000, currency: 'gbp', product: 'prod_fk' }] })
    expect((await contribute(req({ tier_id: 'firekeeper', email: 'a@b.com', wall_name: 'X' }))).status).toBe(400)
    const res = await contribute(req({ tier_id: 'firekeeper', email: 'a@b.com', wall_name: 'X', business_name: 'Hatters Ltd' }))
    expect(res.status).toBe(200)
    expect(mockCreate.mock.calls[0][0].metadata).toMatchObject({ business_name: 'Hatters Ltd', logo: 'to-request-by-email' })
  })

  it('requires a wall name unless anonymous, and a valid tier', async () => {
    expect((await contribute(req({ tier_id: 'warm-up', email: 'a@b.com' }))).status).toBe(400)
    expect((await contribute(req({ tier_id: 'platinum', email: 'a@b.com', anonymous: true }))).status).toBe(400)
  })

  it('refuses checkout when Stripe and config disagree on the price', async () => {
    mockPrices.mockResolvedValue({ data: [{ id: 'price_old', unit_amount: 1500, currency: 'gbp', product: 'p' }] })
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await contribute(req({ tier_id: 'warm-up', email: 'a@b.com', anonymous: true }))
    errSpy.mockRestore()
    expect(res.status).toBe(503)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('pop-up bookings while paused', () => {
  it('POST /api/bookings returns 410 and creates nothing', async () => {
    const res = await book(new NextRequest('http://localhost/api/bookings', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(410)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
