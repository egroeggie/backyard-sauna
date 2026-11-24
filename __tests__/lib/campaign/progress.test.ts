/**
 * @jest-environment node
 */
import type Stripe from 'stripe'
import {
  classifySession, netPence, summarise, fetchCampaignProgress, headlineGoal, milestoneStates, startUnix,
  type SessionLike,
} from '@/lib/campaign/progress'
import { campaign, sortedMilestones } from '@/config/campaign'

const START = startUnix('2026-06-03')
let n = 0

/** A paid GBP Checkout Session with an expanded charge, overridable per test. */
function session(over: Partial<SessionLike> & { refunded?: number; amount?: number; chargeStatus?: string; piStatus?: string } = {}): SessionLike {
  const { refunded = 0, amount = 2000, chargeStatus = 'succeeded', piStatus = 'succeeded', ...rest } = over
  n++
  return {
    id: `cs_test_${n}`,
    created: START + 1000 + n,
    currency: 'gbp',
    status: 'complete',
    payment_status: 'paid',
    amount_total: amount,
    metadata: { campaign: 'permanent-venue', tier: 'warm-up' },
    customer_email: `backer${n}@example.com`,
    customer_details: { email: `backer${n}@example.com` },
    customer: null,
    payment_intent: {
      id: `pi_${n}`,
      status: piStatus,
      latest_charge: { id: `ch_${n}`, status: chargeStatus, amount, amount_refunded: refunded, currency: 'gbp' },
    },
    ...rest,
  }
}

const opts = { campaignId: 'permanent-venue', startUnix: START }

describe('classifySession', () => {
  it('counts sessions tagged with this campaign', () => {
    expect(classifySession({ metadata: { campaign: 'permanent-venue', tier: 'warm-up' } })).toBe('campaign')
  })
  it('counts pre-tagging contributions by their tier_name marker', () => {
    expect(classifySession({ metadata: { tier_name: 'Deep heat' } })).toBe('legacy-campaign')
    expect(classifySession({ metadata: { tier_name: 'custom' } })).toBe('legacy-campaign')
  })
  it('never counts pop-up bookings, even if they somehow carry a campaign tag', () => {
    expect(classifySession({ metadata: { booking_id: 'b1' } })).toBeNull()
    expect(classifySession({ metadata: { booking_id: 'b1', campaign: 'permanent-venue' } })).toBeNull()
  })
  it('ignores other campaigns and untagged sessions', () => {
    expect(classifySession({ metadata: { campaign: 'something-else' } })).toBeNull()
    expect(classifySession({ metadata: {} })).toBeNull()
    expect(classifySession({ metadata: null })).toBeNull()
  })
})

describe('netPence', () => {
  it('returns the charge amount for a paid session', () => {
    expect(netPence(session({ amount: 5000 }))).toBe(5000)
  })
  it('subtracts partial refunds', () => {
    expect(netPence(session({ amount: 5000, refunded: 2000 }))).toBe(3000)
  })
  it('returns 0 for fully refunded payments', () => {
    expect(netPence(session({ amount: 5000, refunded: 5000 }))).toBe(0)
  })
  it('returns 0 for unpaid, failed or non-GBP payments', () => {
    expect(netPence(session({ payment_status: 'unpaid' }))).toBe(0)
    expect(netPence(session({ status: 'expired' }))).toBe(0)
    expect(netPence(session({ piStatus: 'requires_payment_method' }))).toBe(0)
    expect(netPence(session({ chargeStatus: 'failed' }))).toBe(0)
    expect(netPence(session({ currency: 'eur' }))).toBe(0)
  })
  it('counts the original GBP amount when Adaptive Pricing charged another currency', () => {
    const usd = (refunded: number) => session({
      currency: 'usd',
      currency_conversion: { source_currency: 'gbp', amount_total: 2000 },
      payment_intent: { id: 'pi_usd', status: 'succeeded', latest_charge: { id: 'ch_usd', status: 'succeeded', amount: 2724, amount_refunded: refunded, currency: 'usd' } },
    })
    expect(netPence(usd(0))).toBe(2000)
    expect(netPence(usd(1362))).toBe(1000) // half refunded
    expect(netPence(usd(2724))).toBe(0)
    // Natively non-GBP prices (no conversion from GBP) are never counted
    expect(netPence(session({ currency: 'usd', currency_conversion: null }))).toBe(0)
  })
  it('refuses to guess when the charge was not expanded (refunds would be invisible)', () => {
    expect(() => netPence(session({ payment_intent: 'pi_unexpanded' }))).toThrow(/not expanded/)
  })
})

describe('summarise', () => {
  it('sums campaign payments, minus refunds, plus the offline adjustment', () => {
    const sessions = [
      session({ amount: 2000 }),                                   // £20
      session({ amount: 10000, refunded: 2500 }),                  // £100, £25 refunded → £75
      session({ amount: 5000, refunded: 5000 }),                   // fully refunded → 0
      session({ amount: 1500, metadata: { tier_name: 'Warm up' } }), // legacy £15
      session({ amount: 3000, metadata: { booking_id: 'b1' } }),   // pop-up booking: excluded
      session({ amount: 999, metadata: {} }),                      // untagged: excluded
      session({ amount: 7000, created: START - 1 }),               // before start date: excluded
      session({ amount: 4000, payment_status: 'unpaid' }),         // unpaid: excluded
    ]
    const r = summarise(sessions, { ...opts, offlineAdjustmentPence: 12345 })
    expect(r.stripePence).toBe(2000 + 7500 + 1500)
    expect(r.raisedPence).toBe(2000 + 7500 + 1500 + 12345)
    expect(r.payments).toBe(3)
    expect(r.backers).toBe(3)
  })

  it('counts unique backers by email (case-insensitive), then customer, then session', () => {
    const sessions = [
      session({ customer_details: { email: 'Sam@Example.com' }, customer_email: null }),
      session({ customer_details: { email: 'sam@example.com' }, customer_email: null }),
      session({ customer_details: { email: null }, customer_email: null, customer: 'cus_1' }),
      session({ customer_details: { email: null }, customer_email: null, customer: { id: 'cus_1' } }),
      session({ customer_details: null, customer_email: null, customer: null }),
    ]
    const r = summarise(sessions, opts)
    expect(r.payments).toBe(5)
    expect(r.backers).toBe(3)
  })

  it('does not count a fully refunded person as a backer', () => {
    const r = summarise([session({ refunded: 2000 })], opts)
    expect(r).toMatchObject({ raisedPence: 0, backers: 0, payments: 0 })
  })

  it('ignores duplicate sessions (e.g. overlapping pages)', () => {
    const s = session()
    expect(summarise([s, s], opts).raisedPence).toBe(2000)
  })

  it('returns zero for no payments (a real zero, not an error)', () => {
    expect(summarise([], opts)).toMatchObject({ raisedPence: 0, backers: 0 })
  })
})

describe('fetchCampaignProgress (mocked Stripe)', () => {
  it('lists completed sessions since startDate with charges expanded and returns the API shape', async () => {
    const autoPagingToArray = jest.fn().mockResolvedValue([
      session({ amount: 5000 }),
      session({ amount: 2000, refunded: 500 }),
      session({ amount: 3000, metadata: { booking_id: 'b9' } }),
    ])
    const list = jest.fn().mockReturnValue({ autoPagingToArray })
    const stripe = { checkout: { sessions: { list } } } as unknown as Stripe

    const now = new Date('2026-11-24T12:00:00Z')
    const p = await fetchCampaignProgress(stripe, now)

    expect(list).toHaveBeenCalledWith(expect.objectContaining({
      created: { gte: startUnix(campaign.startDate) },
      status: 'complete',
      expand: ['data.payment_intent.latest_charge'],
    }))
    expect(p).toEqual({
      raised: 65 + campaign.offlineAdjustment,
      backers: 2,
      primaryTarget: campaign.primaryTarget,
      milestones: sortedMilestones(),
      currency: 'GBP',
      updatedAt: '2026-11-24T12:00:00.000Z',
    })
  })

  it('propagates Stripe errors so the cache layer can fall back (never returns £0)', async () => {
    const list = jest.fn().mockReturnValue({ autoPagingToArray: jest.fn().mockRejectedValue(new Error('Stripe down')) })
    const stripe = { checkout: { sessions: { list } } } as unknown as Stripe
    await expect(fetchCampaignProgress(stripe)).rejects.toThrow('Stripe down')
  })
})

describe('headline and milestone states', () => {
  const ms = [
    { amount: 20000, label: 'a', blurb: '' },
    { amount: 30000, label: 'b', blurb: '' },
    { amount: 40000, label: 'c', blurb: '' },
  ]
  it('compares against the primary target until it is passed, then the stretch goal', () => {
    expect(headlineGoal(5000, 30000, ms)).toEqual({ amount: 30000, stretch: false })
    expect(headlineGoal(29999, 30000, ms)).toEqual({ amount: 30000, stretch: false })
    expect(headlineGoal(30000, 30000, ms)).toEqual({ amount: 40000, stretch: true })
    expect(headlineGoal(45000, 30000, ms)).toEqual({ amount: 40000, stretch: true })
  })
  it('marks reached / next / locked', () => {
    expect(milestoneStates(0, ms)).toEqual(['next', 'locked', 'locked'])
    expect(milestoneStates(25000, ms)).toEqual(['reached', 'next', 'locked'])
    expect(milestoneStates(40000, ms)).toEqual(['reached', 'reached', 'reached'])
  })
})
