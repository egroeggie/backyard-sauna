import { unstable_cache } from 'next/cache'
import { stripe } from '@/lib/stripe'
import { campaign } from '@/config/campaign'
import { fetchCampaignProgress, type CampaignProgress } from './progress'

export const CAMPAIGN_PROGRESS_TAG = 'campaign-progress'
export const CAMPAIGN_PROGRESS_TTL = 300

// Errors thrown inside unstable_cache are not cached, and a failed background
// revalidation keeps serving the previous (stale) entry, so a Stripe outage
// shows the last good figures rather than £0.
const cachedFetch = unstable_cache(
  () => fetchCampaignProgress(stripe),
  // Config is part of the key so changing figures in config/campaign.ts takes effect on deploy.
  ['campaign-progress', JSON.stringify(campaign)],
  { revalidate: CAMPAIGN_PROGRESS_TTL, tags: [CAMPAIGN_PROGRESS_TAG] },
)

let lastGood: CampaignProgress | null = null

/** Returns null (never zeros) when Stripe can't be reached and nothing is cached. */
export async function getCampaignProgress(): Promise<CampaignProgress | null> {
  try {
    lastGood = await cachedFetch()
    return lastGood
  } catch (err) {
    console.error('[campaign-progress] Stripe fetch failed', err)
    return lastGood
  }
}
