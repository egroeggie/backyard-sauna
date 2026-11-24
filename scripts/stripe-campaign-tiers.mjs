#!/usr/bin/env node
/**
 * Sets up the campaign reward tiers in Stripe from config/campaign.ts.
 *
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-campaign-tiers.mjs            # dry run (default)
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-campaign-tiers.mjs --apply    # create/archive in TEST mode
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-campaign-tiers.mjs --apply --live   # LIVE mode
 *   STRIPE_SECRET_KEY=...         node scripts/stripe-campaign-tiers.mjs --report   # list legacy tier payments
 *
 * Safe to re-run: prices are found by lookup key, so nothing is duplicated.
 * Never deletes anything: old prices/products are archived (active=false).
 * Needs Node >= 22.18 (reads the TypeScript config directly).
 */
import Stripe from 'stripe'
import { campaign, tiers, tierLookupKey } from '../config/campaign.ts'

const args = new Set(process.argv.slice(2))
const APPLY = args.has('--apply')
const LIVE = args.has('--live')
const REPORT = args.has('--report')

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Set STRIPE_SECRET_KEY first.')
  process.exit(1)
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() })

const { livemode } = await stripe.balance.retrieve()
console.log(`Stripe mode: ${livemode ? 'LIVE' : 'test'}${APPLY ? '' : ' (dry run: pass --apply to make changes)'}\n`)
if (livemode && APPLY && !LIVE) {
  console.error('Refusing to change LIVE mode without --live.')
  process.exit(1)
}

const act = async (msg, fn) => {
  console.log(`${APPLY ? '→' : '[dry run]'} ${msg}`)
  return APPLY ? fn() : null
}

if (REPORT) {
  await report()
  process.exit(0)
}

// 1. Create (or reuse) one Product + Price per tier.
for (const tier of tiers) {
  const lookup_key = tierLookupKey(tier.id)
  const metadata = { campaign: campaign.id, tier: tier.id }
  const { data } = await stripe.prices.list({ lookup_keys: [lookup_key], active: true, expand: ['data.product'] })
  const existing = data[0]
  const wantAmount = tier.amount === null ? null : tier.amount * 100

  const matches = existing && (wantAmount === null
    ? existing.custom_unit_amount != null && (existing.custom_unit_amount.minimum ?? 0) === campaign.customMinimum * 100
    : existing.unit_amount === wantAmount && existing.currency === 'gbp')
  if (matches) {
    console.log(`✓ ${tier.id}: ${existing.id} already set up`)
    continue
  }

  let productId = existing && typeof existing.product === 'object' ? existing.product.id : null
  if (!productId) {
    const found = await stripe.products.search({ query: `metadata['campaign']:'${campaign.id}' AND metadata['tier']:'${tier.id}'` })
    productId = found.data[0]?.id ?? null
  }
  if (!productId) {
    const p = await act(`create product "${tier.name}"`, () =>
      stripe.products.create({ name: `Backyard Sauna: ${tier.name}`, description: tier.reward, metadata }))
    productId = p?.id ?? '(new product)'
  }

  const priceParams = {
    product: productId,
    currency: 'gbp',
    lookup_key,
    transfer_lookup_key: true, // moves the key off any old price with a different amount
    metadata,
    nickname: tier.name,
    ...(wantAmount === null
      ? { custom_unit_amount: { enabled: true, minimum: campaign.customMinimum * 100 } }
      : { unit_amount: wantAmount }),
  }
  const price = await act(`create price ${tier.id} (${wantAmount === null ? 'custom amount' : `£${tier.amount}`}) on ${productId}`, () =>
    stripe.prices.create(priceParams))
  if (price) console.log(`  ${tier.id}: ${price.id}`)
  if (existing) await act(`archive superseded price ${existing.id}`, () => stripe.prices.update(existing.id, { active: false }))
}

// 2. Archive any other active Backyard Sauna contribution prices not tagged for this campaign.
// (The old £5/£15/£30/£50/custom tiers were created inline at checkout, so Stripe normally
// has nothing active to archive; this catches any made by hand in the dashboard.)
console.log('\nOld tier prices:')
let archived = 0
for await (const price of stripe.prices.list({ active: true, limit: 100, expand: ['data.product'] })) {
  const product = typeof price.product === 'object' ? price.product : null
  if (!product || product.deleted) continue
  const isOldContribution = /^Backyard Sauna\s+[—-]\s+/.test(product.name) && product.metadata?.campaign !== campaign.id
  if (!isOldContribution) continue
  archived++
  await act(`archive old price ${price.id} (${product.name}, ${price.unit_amount} ${price.currency})`, () =>
    stripe.prices.update(price.id, { active: false }))
}
if (!archived) console.log('  none active (old tiers used inline prices, so there is nothing to archive)')

console.log('\nDone. The site finds these prices by lookup key, so no price IDs need copying into env vars.')

async function report() {
  const start = Math.floor(new Date(`${campaign.startDate}T00:00:00Z`).getTime() / 1000)
  console.log(`Contributions since ${campaign.startDate}, by tier:\n`)
  const rows = []
  for await (const s of stripe.checkout.sessions.list({ created: { gte: start }, status: 'complete', limit: 100, expand: ['data.payment_intent.latest_charge'] })) {
    const md = s.metadata ?? {}
    if (md.booking_id) continue
    if (!md.campaign && !md.tier_name) continue
    const ch = s.payment_intent?.latest_charge
    rows.push({
      date: new Date(s.created * 1000).toISOString().slice(0, 10),
      kind: md.campaign ? 'new' : 'legacy',
      tier: md.tier ?? md.tier_name,
      amount: (s.amount_total ?? 0) / 100,
      currency: s.currency,
      gbp_if_converted: s.currency_conversion ? s.currency_conversion.amount_total / 100 : '',
      refunded: ch ? ch.amount_refunded / 100 : '?',
      email: (s.customer_details?.email ?? s.customer_email ?? s.id).toLowerCase(),
      session: s.id,
      payment_intent: s.payment_intent?.id ?? s.payment_intent,
    })
  }
  console.table(rows)
  // Independent cross-check for /api/campaign-progress (before offlineAdjustment).
  let net = 0
  const people = new Set()
  for (const r of rows) {
    if (r.refunded === '?') continue
    const paid = r.currency === 'gbp' ? r.amount : r.gbp_if_converted
    if (paid === '') continue
    const kept = r.currency === 'gbp' ? r.amount - r.refunded : paid * (1 - r.refunded / r.amount)
    if (kept > 0) { net += kept; people.add(r.email) }
  }
  console.log(`\nNet GBP from Stripe: £${net.toFixed(2)} from ${people.size} backer(s). Add offlineAdjustment (£${campaign.offlineAdjustment}) to compare with /api/campaign-progress.`)
}
