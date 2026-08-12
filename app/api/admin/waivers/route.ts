import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createWalkInWaiver, getWaiverByToken } from '@/lib/db/waivers'
import { sendWaiverLinkEmail } from '@/lib/email'

const SITE = process.env.NEXT_PUBLIC_SITE_URL!

const walkInSchema = z.object({
  action: z.literal('walk_in'),
  event_title: z.string().min(1),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().email(),
  name: z.string().optional(),
})

const resendSchema = z.object({
  action: z.literal('resend'),
  waiver_token: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
})

const schema = z.discriminatedUnion('action', [walkInSchema, resendSchema])

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    if (parsed.data.action === 'walk_in') {
      const { event_title, event_date, email, name } = parsed.data
      const waiver = await createWalkInWaiver(event_title, event_date)
      const waiverUrl = `${SITE}/waiver/${waiver.token}`
      await sendWaiverLinkEmail({ to: email, name, eventTitle: event_title, eventDate: event_date, waiverUrl })
      return NextResponse.json({ token: waiver.token, waiverUrl })
    }

    // resend
    const { waiver_token, email, name } = parsed.data
    const waiver = await getWaiverByToken(waiver_token)
    if (waiver.signed_at) return NextResponse.json({ error: 'Already signed' }, { status: 409 })
    const eventTitle = waiver.event_title ?? 'Backyard Sauna session'
    const eventDate = waiver.event_date ?? ''
    const waiverUrl = `${SITE}/waiver/${waiver.token}`
    await sendWaiverLinkEmail({ to: email, name, eventTitle, eventDate, waiverUrl })
    return NextResponse.json({ waiverUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/waivers]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
