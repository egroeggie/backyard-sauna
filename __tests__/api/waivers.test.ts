/**
 * @jest-environment node
 */

jest.mock('@/lib/admin/auth')
jest.mock('@/lib/db/waivers')
jest.mock('@/lib/email')

import { POST } from '@/app/api/admin/waivers/route'
import { requireAdmin } from '@/lib/admin/auth'
import { markWaiverSigned, updateWaiver, deleteWaiver } from '@/lib/db/waivers'
import { NextRequest } from 'next/server'

const makeRequest = (body: object) =>
  new NextRequest('http://localhost/api/admin/waivers', {
    method: 'POST',
    body: JSON.stringify(body),
  })

describe('POST /api/admin/waivers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue(true)
  })

  it('returns 401 if not admin', async () => {
    ;(requireAdmin as jest.Mock).mockResolvedValue(false)
    const res = await POST(makeRequest({ action: 'delete', waiver_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }))
    expect(res.status).toBe(401)
  })

  describe('mark_signed', () => {
    it('marks the waiver as signed with given fields', async () => {
      ;(markWaiverSigned as jest.Mock).mockResolvedValue({ id: 'w1', signed_at: '2026-08-12T00:00:00Z' })
      const res = await POST(makeRequest({
        action: 'mark_signed', waiver_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Bob', email: 'bob@test.com', dob: '1990-01-01',
      }))
      expect(res.status).toBe(200)
      expect(markWaiverSigned).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479', {
        name: 'Bob', email: 'bob@test.com', dob: '1990-01-01',
      })
    })

    it('returns 500 if the waiver is already signed', async () => {
      ;(markWaiverSigned as jest.Mock).mockRejectedValue(new Error('Waiver already signed or not found'))
      const res = await POST(makeRequest({ action: 'mark_signed', waiver_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }))
      expect(res.status).toBe(500)
    })
  })

  describe('edit', () => {
    it('updates waiver fields', async () => {
      ;(updateWaiver as jest.Mock).mockResolvedValue({ id: 'w1', name: 'Robert' })
      const res = await POST(makeRequest({ action: 'edit', waiver_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Robert' }))
      expect(res.status).toBe(200)
      expect(updateWaiver).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479', { name: 'Robert', email: undefined, dob: undefined })
    })
  })

  describe('delete', () => {
    it('deletes the waiver', async () => {
      ;(deleteWaiver as jest.Mock).mockResolvedValue(undefined)
      const res = await POST(makeRequest({ action: 'delete', waiver_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }))
      expect(res.status).toBe(200)
      expect(deleteWaiver).toHaveBeenCalledWith('f47ac10b-58cc-4372-a567-0e02b2c3d479')
    })
  })

  it('returns 400 on invalid action payload', async () => {
    const res = await POST(makeRequest({ action: 'mark_signed', waiver_id: 'not-a-uuid' }))
    expect(res.status).toBe(400)
  })
})
