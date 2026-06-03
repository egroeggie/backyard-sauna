import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { updateEvent, deleteEvent } from '@/lib/db/events'

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  price_pence: z.number().int().positive().optional(),
  is_published: z.boolean().optional(),
  capacity: z.number().int().min(5).max(100).optional(),
})

async function isAdmin() {
  const sb = await createClient()
  const { data: { session } } = await sb.auth.getSession()
  return !!session
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { getEventById } = await import('@/lib/db/events')
  const { getSlotsByEventId } = await import('@/lib/db/slots')
  const [event, slots] = await Promise.all([getEventById(id), getSlotsByEventId(id)])
  return NextResponse.json({ ...event, slots })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { capacity, ...eventData } = parsed.data
  const event = await updateEvent(id, eventData)
  if (capacity !== undefined) {
    const sb = createServiceClient()
    await sb.from('slots').update({ capacity }).eq('event_id', id)
  }
  return NextResponse.json(event)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await deleteEvent(id)
  return new NextResponse(null, { status: 204 })
}
