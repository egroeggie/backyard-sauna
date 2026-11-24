import { NextResponse } from 'next/server'
import { getCampaignProgress, CAMPAIGN_PROGRESS_TTL } from '@/lib/campaign/cached'

export const revalidate = 300

export async function GET() {
  const progress = await getCampaignProgress()
  if (!progress) {
    // No figures available: tell the client to hide the amount, never to show £0.
    return NextResponse.json(
      { error: 'Progress temporarily unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return NextResponse.json(progress, {
    headers: {
      'Cache-Control': `public, s-maxage=${CAMPAIGN_PROGRESS_TTL}, stale-while-revalidate=86400`,
    },
  })
}
