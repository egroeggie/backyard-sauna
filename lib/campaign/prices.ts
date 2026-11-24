import type Stripe from 'stripe'
import { tierLookupKey } from '@/config/campaign'

/**
 * Finds the active Stripe Price for a tier by lookup key (`permanent-venue:<tier>`).
 * Lookup keys mean test and live mode each resolve their own price IDs, so no
 * IDs are hard-coded or need copying into env vars.
 */
export async function findTierPrice(stripe: Stripe, tierId: string): Promise<Stripe.Price | null> {
  const res = await stripe.prices.list({ lookup_keys: [tierLookupKey(tierId)], active: true, limit: 1 })
  return res.data[0] ?? null
}
