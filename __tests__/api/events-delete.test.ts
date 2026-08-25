/**
 * @jest-environment node
 */

jest.mock('@/lib/admin/auth')
jest.mock('@/lib/db/events')
jest.mock('@/lib/supabase/service')

import { DELETE, PATCH } from '@/app/api/admin/events/[id]/route'
import { requireAdmin } from '@/lib/admin/auth'
import { eventHasHistory, deleteEvent, updateEvent } from '@/lib/db/events'
import { NextRequest } from 'next/server'

const call = (method: 'DELETE' | 'PATCH', body?: object) => {
  const req = new NextRequest('http://localhost/api/admin/events/e1', {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return method === 'DELETE'
    ? DELETE(req, { params: Promise.resolve({ id: 'e1' }) })
    : PATCH(req, { params: Promise.resolve({ id: 'e1' }) })
}

describe('DELETE /api/admin/events/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue(true)
  })

  it('returns 401 if not admin', async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue(false)
    const res = await call('DELETE')
    expect(res.status).toBe(401)
  })

  it('blocks deletion with 409 when the event has history', async () => {
    ;(eventHasHistory as jest.Mock).mockResolvedValue(true)
    const res = await call('DELETE')
    expect(res.status).toBe(409)
    expect(deleteEvent).not.toHaveBeenCalled()
    const data = await res.json()
    expect(data.error).toMatch(/Archive it instead/i)
  })

  it('deletes when the event has no history', async () => {
    ;(eventHasHistory as jest.Mock).mockResolvedValue(false)
    ;(deleteEvent as jest.Mock).mockResolvedValue(undefined)
    const res = await call('DELETE')
    expect(res.status).toBe(204)
    expect(deleteEvent).toHaveBeenCalledWith('e1')
  })
})

describe('PATCH /api/admin/events/[id] - archived', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue(true)
  })

  it('accepts an archived field', async () => {
    ;(updateEvent as jest.Mock).mockResolvedValue({ id: 'e1', archived: true })
    const res = await call('PATCH', { archived: true })
    expect(res.status).toBe(200)
    expect(updateEvent).toHaveBeenCalledWith('e1', expect.objectContaining({ archived: true }))
  })
})
