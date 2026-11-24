import type Stripe from 'stripe'
import { campaign, sortedMilestones, type Milestone } from '@/config/campaign'

export type CampaignProgress = {
  /** Pounds (GBP), may include pence, e.g. 1234.5 */
  raised: number
  backers: number
  primaryTarget: number
  milestones: Milestone[]
  currency: string
  updatedAt: string
}

/** The subset of a Stripe Checkout Session this module relies on. */
export type SessionLike = Pick<
  Stripe.Checkout.Session,
  'id' | 'created' | 'currency' | 'status' | 'payment_status' | 'metadata' | 'amount_total' | 'customer_email'
> & {
  customer?: string | { id: string } | null
  customer_details?: { email?: string | null } | null
  /** Present when Adaptive Pricing converted the price; amounts are in source_currency. */
  currency_conversion?: { source_currency: string; amount_total: number } | null
  payment_intent?: string | null | {
    id: string
    status: string
    latest_charge?: string | null | {
      id: string
      status: string
      amount: number
      amount_refunded: number
      refunded?: boolean
      currency: string
    }
  }
}

export type Classification = 'campaign' | 'legacy-campaign' | null

/**
 * Which sessions are campaign contributions?
 * - Pop-up bookings always carry `metadata.booking_id`: never counted, even if mis-tagged.
 * - New contributions carry `metadata.campaign = <campaign.id>`.
 * - Contributions made before tagging (old /api/contribute, live since 2026-06-03)
 *   only carry `metadata.tier_name`; nothing else on the site sets it, so it is a
 *   reliable marker for the archived £5/£15/£30/£50/custom tiers.
 */
export function classifySession(s: Pick<SessionLike, 'metadata'>, campaignId: string = campaign.id): Classification {
  const md = s.metadata ?? {}
  if (md.booking_id) return null
  if (md.campaign) return md.campaign === campaignId ? 'campaign' : null
  if (md.tier_name) return 'legacy-campaign'
  return null
}

/**
 * Net GBP pence actually kept from one session (0 if unpaid, not GBP-priced or fully refunded).
 *
 * Adaptive Pricing (on in this Stripe account) lets non-UK visitors pay in their own
 * currency. Such sessions report `currency: 'usd'` etc, with the original GBP price in
 * `currency_conversion`. We count the GBP amount, reduced in proportion to any refund.
 */
export function netPence(s: SessionLike): number {
  if (s.status !== 'complete' || s.payment_status !== 'paid') return 0
  const currency = (s.currency ?? '').toLowerCase()
  const conv = s.currency_conversion
  const convertedFromGbp = currency !== 'gbp' && conv?.source_currency?.toLowerCase() === 'gbp'
  if (currency !== 'gbp' && !convertedFromGbp) return 0

  const pi = s.payment_intent
  if (pi && typeof pi === 'object') {
    if (pi.status !== 'succeeded') return 0
    const ch = pi.latest_charge
    if (ch && typeof ch === 'object') {
      if (ch.status !== 'succeeded' || ch.currency.toLowerCase() !== currency) return 0
      if (!convertedFromGbp) return Math.max(0, ch.amount - ch.amount_refunded)
      const keptFraction = ch.amount > 0 ? Math.max(0, ch.amount - ch.amount_refunded) / ch.amount : 0
      return Math.round(conv!.amount_total * keptFraction)
    }
  }
  // Charge not expanded: we can't see refunds, so refuse to guess.
  throw new Error(`Session ${s.id}: payment_intent.latest_charge was not expanded`)
}

function backerKey(s: SessionLike): string {
  const email = (s.customer_details?.email ?? s.customer_email ?? '').trim().toLowerCase()
  if (email) return `email:${email}`
  const cust = typeof s.customer === 'string' ? s.customer : s.customer?.id
  if (cust) return `customer:${cust}`
  return `session:${s.id}`
}

export function summarise(
  sessions: SessionLike[],
  opts: { campaignId?: string; startUnix: number; offlineAdjustmentPence?: number },
) {
  let pence = 0
  let payments = 0
  const backers = new Set<string>()
  const seen = new Set<string>()

  for (const s of sessions) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    if (s.created < opts.startUnix) continue
    if (!classifySession(s, opts.campaignId)) continue
    const net = netPence(s)
    if (net <= 0) continue
    pence += net
    payments++
    backers.add(backerKey(s))
  }

  return {
    raisedPence: pence + (opts.offlineAdjustmentPence ?? 0),
    stripePence: pence,
    payments,
    backers: backers.size,
  }
}

export function startUnix(date: string = campaign.startDate): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000)
}

/** Reads every Checkout Session since startDate from Stripe and totals the campaign ones. */
export async function fetchCampaignProgress(stripe: Stripe, now = new Date()): Promise<CampaignProgress> {
  const start = startUnix()
  const sessions = (await stripe.checkout.sessions
    .list({
      created: { gte: start },
      status: 'complete',
      limit: 100,
      expand: ['data.payment_intent.latest_charge'],
    })
    .autoPagingToArray({ limit: 10000 })) as unknown as SessionLike[]

  const s = summarise(sessions, {
    campaignId: campaign.id,
    startUnix: start,
    offlineAdjustmentPence: Math.round(campaign.offlineAdjustment * 100),
  })

  return {
    raised: s.raisedPence / 100,
    backers: s.backers,
    primaryTarget: campaign.primaryTarget,
    milestones: sortedMilestones(),
    currency: campaign.currency,
    updatedAt: now.toISOString(),
  }
}

export type MilestoneState = 'reached' | 'next' | 'locked'

/** What the headline should compare against: the primary target, then the next milestone above it. */
export function headlineGoal(raised: number, primaryTarget: number, milestones: Milestone[]) {
  const sorted = [...milestones].sort((a, b) => a.amount - b.amount)
  const top = sorted[sorted.length - 1]?.amount ?? primaryTarget
  if (raised < primaryTarget) return { amount: primaryTarget, stretch: false }
  const next = sorted.find(m => m.amount > raised && m.amount > primaryTarget)
  return { amount: next?.amount ?? top, stretch: true }
}

export function milestoneStates(raised: number, milestones: Milestone[]): MilestoneState[] {
  let nextAssigned = false
  return milestones.map(m => {
    if (raised >= m.amount) return 'reached'
    if (!nextAssigned) { nextAssigned = true; return 'next' }
    return 'locked'
  })
}
