import { Suspense } from 'react'
import type { Metadata } from 'next'
import { NavBar } from '@/components/NavBar'
import { CampaignProgress, CampaignProgressSkeleton, MilestoneList } from '@/components/CampaignProgress'
import { getCampaignProgress } from '@/lib/campaign/cached'
import { refundPolicy, tierNotes } from '@/config/campaign'
import { TierPicker } from './TierPicker'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Back the campaign | Backyard Sauna',
  description: "Help build Stockport's permanent community sauna and cold plunge. See live progress towards the target.",
}

async function ProgressAndMilestones() {
  const progress = await getCampaignProgress()
  return (
    <>
      <CampaignProgress progress={progress} />
      <section className="flex flex-col gap-4" aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" className="font-display text-[#edea5a] text-[26px] leading-tight text-center">
          Here&apos;s what we need to raise, and what each step pays for
        </h2>
        <MilestoneList raised={progress?.raised ?? null} />
      </section>
    </>
  )
}

function MilestonesFallback() {
  return (
    <>
      <CampaignProgressSkeleton />
      <div className="h-[330px]" aria-hidden />
    </>
  )
}

function RefundPolicy() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  if (refundPolicy) {
    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-[#edea5a] font-semibold text-[15px]">What if the venue doesn&apos;t open?</h3>
        <p className="text-[#e8e6a8] font-light text-[14px] leading-relaxed">{refundPolicy}</p>
      </div>
    )
  }
  // Placeholder never reaches production: it only renders on previews and locally.
  if (isProduction) return null
  return (
    <div className="flex flex-col gap-1 rounded-md border-2 border-dashed border-[#ff8a80] bg-[#ff8a80]/10 p-4" data-testid="refund-policy-todo">
      <h3 className="text-[#edea5a] font-semibold text-[15px]">What if the venue doesn&apos;t open?</h3>
      <p className="text-[#ffb4a8] font-semibold text-[14px]">
        TODO (preview only): George &amp; Cam to confirm refund or rollover policy. Set <code>refundPolicy</code> in
        config/campaign.ts. This block is hidden on production until then.
      </p>
    </div>
  )
}

export default function TakepartPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col pb-[90px]">
      <div className="flex-1 w-full max-w-[440px] sm:max-w-[640px] mx-auto px-6 pt-20 flex flex-col gap-10">

        <h1 className="font-display text-[#edea5a] text-[36px] leading-[46px] text-center">
          Help us build Stockport&apos;s permanent sauna.
        </h1>

        <Suspense fallback={<MilestonesFallback />}>
          <ProgressAndMilestones />
        </Suspense>

        <div className="text-[#edea5a] font-light text-[15px] leading-relaxed space-y-4">
          <p>
            Backyard Sauna started as a pop-up. A couple of tents and a beer garden in Stockport.
            We wanted to see if people here wanted this. Turns out, they do.
          </p>
          <p>
            The pop-ups are paused for winter, and everything now goes into a permanent home in Stockport town
            centre: a proper sauna and cold plunge / ice baths, open all year, and priced so everyone can come.
          </p>
          <p>
            We&apos;re not venture-backed. We&apos;re not a wellness brand. We&apos;re two people from Stockport
            who think this place deserves a cold plunge.
          </p>
          <p>Every pound goes toward the permanent venue. Rewards for the early ones.</p>
        </div>

        <TierPicker />

        <div className="flex flex-col gap-5 border-t border-[#edea5a]/30 pt-6">
          <p className="text-[#e8e6a8] font-light text-[14px] leading-relaxed">{tierNotes}</p>
          <RefundPolicy />
        </div>

      </div>
      <NavBar />
    </div>
  )
}
