import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createEvent, getAllEvents } from '@/lib/db/events'
import { createSlots } from '@/lib/db/slots'

const schema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().min(1),
  description: z.string().min(1),
  price_pence: z.number().int().positive(),
  is_published: z.boolean().default(false),
  slots: z.array(z.object({
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1),
  capacity: z.number().int().min(5).max(100).default(12),
})

async function isAdmin() {
  const sb = await createClient()
  const { data: { session } } = await sb.auth.getSession()
  return !!session
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAllEvents())
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { slots: slotInputs, capacity, ...eventData } = parsed.data
  const event = await createEvent({ ...eventData, image_url: null })
  await createSlots(slotInputs.map(s => ({ event_id: event.id, ...s, capacity })))
  return NextResponse.json(event, { status: 201 })
}
