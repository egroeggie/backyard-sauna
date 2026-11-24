import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { stripe } from '@/lib/stripe'
import { campaign, getTier, tierNotes } from '@/config/campaign'

export const dynamic = 'force-dynamic'

async function getBackedTier(sessionId: string | undefined) {
  if (!sessionId || !sessionId.startsWith('cs_')) return null
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.campaign !== campaign.id || session.payment_status !== 'paid') return null
    const tier = getTier(session.metadata.tier ?? '')
    return tier ? { tier, amount: (session.amount_total ?? 0) / 100 } : null
  } catch {
    return null
  }
}

export default async function ContributeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const backed = await getBackedTier(session_id)

  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col items-center justify-center pb-[70px] pt-20 px-6 text-center">
      <div className="max-w-[440px] w-full flex flex-col items-center gap-6">
        <div className="text-5xl" aria-hidden>🔥</div>
        <h1 className="font-display text-[#edea5a] text-4xl">Thank you.</h1>
        <p className="text-[#edea5a] font-light">
          You&apos;re one of the early ones. Every pound gets us closer to a permanent home in Stockport.
        </p>
        {backed && (
          <div className="w-full rounded-[10px] border border-[#edea5a]/50 px-5 py-4 text-left">
            <p className="text-[#edea5a] font-semibold">
              {backed.tier.name}: £{Number.isInteger(backed.amount) ? backed.amount : backed.amount.toFixed(2)}
            </p>
            <p className="text-[#e8e6a8] font-light text-[14px] mt-1">{backed.tier.reward}</p>
            {backed.tier.business && (
              <p className="text-[#e8e6a8] font-light text-[14px] mt-2">We&apos;ll email you soon to get your logo.</p>
            )}
          </div>
        )}
        <p className="text-[#e8e6a8] font-light text-[14px]">{tierNotes}</p>
        <Link
          href="/support/takepart"
          className="mt-4 bg-[#edea5a] text-[#1f3e2a] font-semibold px-8 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
        >
          See how the campaign&apos;s going
        </Link>
      </div>
      <NavBar />
    </div>
  )
}
