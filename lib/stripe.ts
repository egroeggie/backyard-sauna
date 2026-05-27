import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  maxNetworkRetries: 1,
})

export async function createCheckoutSession(p: {
  bookingId: string; eventTitle: string; eventDate: string
  spaces: number; pricePence: number; customerEmail: string
  successUrl: string; cancelUrl: string
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: p.customerEmail,
    line_items: [{
      price_data: {
        currency: 'gbp',
        unit_amount: p.pricePence,
        product_data: {
          name: `${p.eventTitle} — ${p.eventDate}`,
          description: `${p.spaces} space${p.spaces > 1 ? 's' : ''}`,
        },
      },
      quantity: p.spaces,
    }],
    metadata: { booking_id: p.bookingId },
    success_url: p.successUrl,
    cancel_url: p.cancelUrl,
  })
  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return session.url
}
