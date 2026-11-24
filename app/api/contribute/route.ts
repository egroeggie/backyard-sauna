import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { campaign, getTier, tiers } from '@/config/campaign'
import { findTierPrice } from '@/lib/campaign/prices'

const tierIds = tiers.map(t => t.id) as [string, ...string[]]

const schema = z
  .object({
    tier_id: z.enum(tierIds),
    /** Only used (and required) for the custom tier. Fixed tiers are priced from config + Stripe. */
    amount_pence: z.number().int().optional(),
    email: z.string().trim().email(),
    wall_name: z.string().trim().max(60).optional().default(''),
    anonymous: z.boolean().optional().default(false),
    business_name: z.string().trim().max(100).optional().default(''),
  })
  .superRefine((v, ctx) => {
    const tier = getTier(v.tier_id)!
    if (tier.amount === null) {
      if (v.amount_pence === undefined || v.amount_pence < campaign.customMinimum * 100) {
        ctx.addIssue({ code: 'custom', path: ['amount_pence'], message: `Please enter at least £${campaign.customMinimum}` })
      }
    }
    if (!v.anonymous && !v.wall_name) {
      ctx.addIssue({ code: 'custom', path: ['wall_name'], message: 'Add a name for the wall, or choose to stay anonymous' })
    }
    if (tier.business && !v.business_name) {
      ctx.addIssue({ code: 'custom', path: ['business_name'], message: 'Please tell us the business name' })
    }
  })

function firstError(err: z.ZodError) {
  return err.issues[0]?.message ?? 'Invalid request'
}

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 })

    const v = parsed.data
    const tier = getTier(v.tier_id)!
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    const price = await findTierPrice(stripe, tier.id)
    if (!price) {
      console.error(`[POST /api/contribute] No active Stripe price for tier ${tier.id}. Run scripts/stripe-campaign-tiers.mjs`)
      return NextResponse.json({ error: 'Checkout is not set up yet. Please try again later.' }, { status: 503 })
    }

    let lineItem: NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]>[number]
    if (tier.amount === null) {
      const product = typeof price.product === 'string' ? price.product : price.product.id
      lineItem = { price_data: { currency: 'gbp', product, unit_amount: v.amount_pence! }, quantity: 1 }
    } else {
      if (price.unit_amount !== tier.amount * 100 || price.currency !== 'gbp') {
        console.error(`[POST /api/contribute] Stripe price for ${tier.id} (${price.unit_amount} ${price.currency}) does not match config (£${tier.amount})`)
        return NextResponse.json({ error: 'Checkout is not set up yet. Please try again later.' }, { status: 503 })
      }
      lineItem = { price: price.id, quantity: 1 }
    }

    // Tagged on both the session and the payment so totals never depend on one object.
    const metadata: Record<string, string> = {
      campaign: campaign.id,
      tier: tier.id,
      wall_name: v.anonymous ? '' : v.wall_name,
      anonymous: v.anonymous ? 'true' : 'false',
    }
    if (tier.business) {
      metadata.business_name = v.business_name
      metadata.logo = 'to-request-by-email'
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: v.email,
      customer_creation: 'always',
      // Always charge in GBP so the total is exact (Adaptive Pricing would otherwise offer USD/EUR etc).
      adaptive_pricing: { enabled: false },
      line_items: [lineItem],
      metadata,
      payment_intent_data: { metadata, description: `Backyard Sauna campaign: ${tier.name}` },
      success_url: `${siteUrl}/support/takepart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/support/takepart`,
    })

    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return NextResponse.json({ checkoutUrl: session.url })
  } catch (err) {
    console.error('[POST /api/contribute]', err)
    return NextResponse.json({ error: 'Something went wrong starting checkout. Please try again.' }, { status: 500 })
  }
}
