import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { createWalkInWaiver, getWaiverByToken, markWaiverSigned, updateWaiver, deleteWaiver, checkInWaiver, undoCheckIn } from '@/lib/db/waivers'
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

const markSignedSchema = z.object({
  action: z.literal('mark_signed'),
  waiver_id: z.string().uuid(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  dob: z.string().optional(),
})

const editSchema = z.object({
  action: z.literal('edit'),
  waiver_id: z.string().uuid(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  dob: z.string().optional(),
})

const deleteSchema = z.object({
  action: z.literal('delete'),
  waiver_id: z.string().uuid(),
})

const checkInSchema = z.object({
  action: z.literal('check_in'),
  waiver_id: z.string().uuid(),
})

const undoCheckInSchema = z.object({
  action: z.literal('undo_check_in'),
  waiver_id: z.string().uuid(),
})

const schema = z.discriminatedUnion('action', [
  walkInSchema, resendSchema, markSignedSchema, editSchema, deleteSchema, checkInSchema, undoCheckInSchema,
])

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

    if (parsed.data.action === 'resend') {
      const { waiver_token, email, name } = parsed.data
      const waiver = await getWaiverByToken(waiver_token)
      if (waiver.signed_at) return NextResponse.json({ error: 'Already signed' }, { status: 409 })
      const eventTitle = waiver.event_title ?? 'Backyard Sauna session'
      const eventDate = waiver.event_date ?? ''
      const waiverUrl = `${SITE}/waiver/${waiver.token}`
      await sendWaiverLinkEmail({ to: email, name, eventTitle, eventDate, waiverUrl })
      return NextResponse.json({ waiverUrl })
    }

    if (parsed.data.action === 'mark_signed') {
      const { waiver_id, name, email, dob } = parsed.data
      const waiver = await markWaiverSigned(waiver_id, { name, email, dob })
      return NextResponse.json(waiver)
    }

    if (parsed.data.action === 'edit') {
      const { waiver_id, name, email, dob } = parsed.data
      const waiver = await updateWaiver(waiver_id, { name, email, dob })
      return NextResponse.json(waiver)
    }

    if (parsed.data.action === 'delete') {
      await deleteWaiver(parsed.data.waiver_id)
      return NextResponse.json({ ok: true })
    }

    if (parsed.data.action === 'check_in') {
      try {
        const waiver = await checkInWaiver(parsed.data.waiver_id)
        return NextResponse.json(waiver)
      } catch (err) {
        if (err instanceof Error && err.message === 'Waiver is not signed yet') {
          return NextResponse.json({ error: err.message }, { status: 409 })
        }
        throw err
      }
    }

    // undo_check_in
    const waiver = await undoCheckIn(parsed.data.waiver_id)
    return NextResponse.json(waiver)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[POST /api/admin/waivers]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
