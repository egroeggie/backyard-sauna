/**
 * Campaign config: the ONE place for crowdfunder figures, milestones, tiers and
 * the pop-up pause switch. Change numbers and copy here; no other file should
 * hard-code them.
 *
 * Every figure below is a PLACEHOLDER until George & Cam confirm it.
 */

export type Milestone = {
  /** Whole pounds (GBP). */
  amount: number
  label: string
  blurb: string
}

export type Tier = {
  id: string
  name: string
  /** Whole pounds. `null` means the backer chooses (custom tier). */
  amount: number | null
  reward: string
  /** Shown as the business option on the page; collects a business name at checkout. */
  business?: boolean
}

export const campaign = {
  id: 'permanent-venue',
  currency: 'GBP',
  milestones: [
    { amount: 20000, label: 'The doors open', blurb: 'Minimum to get a permanent site open.' },
    { amount: 30000, label: 'The full build', blurb: 'Our target: sauna, ice baths, changing space and fit-out.' },
    { amount: 40000, label: 'The cold plunge', blurb: 'Stretch goal: a proper cold plunge from day one.' },
  ] satisfies Milestone[],
  primaryTarget: 30000,
  /** Whole pounds: cash, bank transfers, pledges recorded by hand. */
  offlineAdjustment: 0,
  /**
   * Only Stripe payments on or after this date (UTC) count. Placeholder: the day
   * /support/takepart first went live (2026-06-03), so every contribution counts.
   */
  startDate: '2026-06-03',
  /** Minimum custom amount, whole pounds. */
  customMinimum: 1,
} as const

/**
 * Reward tiers. Stripe prices are found by lookup key
 * (`${campaign.id}:${tier.id}`), so the same code works in test and live mode
 * without hard-coded price IDs. `scripts/stripe-campaign-tiers.mjs` creates them.
 */
export const tiers: Tier[] = [
  { id: 'stone-cold', name: 'Stone cold', amount: 5, reward: "Your name on the online founders' wall" },
  { id: 'warm-up', name: 'Warm up', amount: 20, reward: 'Above + 1 off-peak session' },
  { id: 'deep-heat', name: 'Deep heat', amount: 50, reward: 'Above + 3 off-peak sessions + your name on the physical wall' },
  { id: 'true-believer', name: 'True believer', amount: 100, reward: 'Above + a 5-session pass + an invite to opening night' },
  { id: 'founding-family', name: 'Founding family', amount: 250, reward: 'Above + 10 sessions to share + opening night for two' },
  {
    id: 'firekeeper',
    name: 'Firekeeper',
    amount: 500,
    reward: 'For local businesses: a private session for your team (up to 12) + your logo on our supporters board',
    business: true,
  },
  { id: 'custom', name: 'Your amount', amount: null, reward: 'Any amount, with our thanks' },
]

export const tierNotes =
  'Everyone who backs us gets campaign updates. Free sessions are off-peak and valid for 12 months from opening day. Founding family and Firekeeper sessions can be shared; the others are personal to you.'

/**
 * "What if the venue doesn't open?" answer.
 * Leave as `null` until George & Cam confirm the refund or rollover policy.
 * While null: previews show a visible TODO, production shows nothing.
 */
export const refundPolicy: string | null = null

/** Pop-up Sauna Socials pause. While `paused` is true no public page or API takes bookings. */
export const popups = {
  paused: true,
  noticeTitle: 'Pausing the pop-ups.',
  noticeBody:
    "Secondhand kit has a lifespan, and ours is deteriorating. With the weather turning, it's not a risk we're willing to take. Everything now goes into a permanent home in the heart of Stockport. It's a pause, not a full stop.",
  ctaLabel: 'Back the campaign →',
  ctaHref: '/support/takepart',
} as const

export function tierLookupKey(tierId: string) {
  return `${campaign.id}:${tierId}`
}

export function getTier(id: string): Tier | undefined {
  return tiers.find(t => t.id === id)
}

/** Milestones sorted ascending; the last one is the top of the bar. */
export function sortedMilestones(): Milestone[] {
  return [...campaign.milestones].sort((a, b) => a.amount - b.amount)
}
