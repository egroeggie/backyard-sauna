import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'

const schema = z.object({
  amount_pence: z.number().int().min(100),
  tier_name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { amount_pence, tier_name } = parsed.data
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'gbp',
          unit_amount: amount_pence,
          product_data: {
            name: tier_name ? `Backyard Sauna — ${tier_name}` : 'Backyard Sauna — Contribution',
            description: 'Supporting the permanent venue in Stockport',
          },
        },
        quantity: 1,
      }],
      metadata: { tier_name: tier_name ?? 'custom' },
      success_url: `${siteUrl}/support/takepart/success`,
      cancel_url: `${siteUrl}/support/takepart`,
    })

    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return NextResponse.json({ checkoutUrl: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/contribute]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
