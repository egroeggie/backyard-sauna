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

    // Amount always comes from config (custom: from the backer), never from Stripe or the browser.
    const amountPence = tier.amount === null ? v.amount_pence! : tier.amount * 100

    // Use the tier's Stripe Price when it exists and matches config. Otherwise (e.g. live
    // prices not created yet) fall back to an inline GBP price, as the old checkout did.
    // Either way the payment is tagged campaign/tier, so the progress total counts it.
    const price = await findTierPrice(stripe, tier.id).catch(err => {
      console.error(`[POST /api/contribute] price lookup failed for ${tier.id}`, err)
      return null
    })
    const usable = !!price && price.currency === 'gbp' && (tier.amount === null || price.unit_amount === amountPence)
    if (price && !usable) {
      console.warn(`[POST /api/contribute] Stripe price for ${tier.id} (${price.unit_amount} ${price.currency}) does not match config (£${tier.amount}); using inline price`)
    }

    let lineItem: NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]>[number]
    if (usable && tier.amount !== null) {
      lineItem = { price: price!.id, quantity: 1 }
    } else if (usable) {
      const product = typeof price!.product === 'string' ? price!.product : price!.product.id
      lineItem = { price_data: { currency: 'gbp', product, unit_amount: amountPence }, quantity: 1 }
    } else {
      lineItem = {
        price_data: {
          currency: 'gbp',
          unit_amount: amountPence,
          product_data: {
            name: `Backyard Sauna: ${tier.name}`,
            description: tier.reward,
            metadata: { campaign: campaign.id, tier: tier.id },
          },
        },
        quantity: 1,
      }
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
