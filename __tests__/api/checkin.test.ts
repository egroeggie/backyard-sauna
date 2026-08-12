/**
 * @jest-environment node
 */

jest.mock('@/lib/admin/auth')
jest.mock('@/lib/db/waivers')
jest.mock('@/lib/email')

import { POST } from '@/app/api/admin/waivers/route'
import { requireAdmin } from '@/lib/admin/auth'
import { checkInWaiver, undoCheckIn } from '@/lib/db/waivers'
import { NextRequest } from 'next/server'

const WAIVER_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

const makeRequest = (body: object) =>
  new NextRequest('http://localhost/api/admin/waivers', {
    method: 'POST',
    body: JSON.stringify(body),
  })

describe('POST /api/admin/waivers - check-in actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(requireAdmin as jest.Mock).mockResolvedValue(true)
  })

  describe('check_in', () => {
    it('checks in a signed waiver', async () => {
      ;(checkInWaiver as jest.Mock).mockResolvedValue({ id: 'w1', checked_in_at: '2026-08-12T10:00:00Z' })
      const res = await POST(makeRequest({ action: 'check_in', waiver_id: WAIVER_UUID }))
      expect(res.status).toBe(200)
      expect(checkInWaiver).toHaveBeenCalledWith(WAIVER_UUID)
    })

    it('returns 409 if the waiver is not signed yet', async () => {
      ;(checkInWaiver as jest.Mock).mockRejectedValue(new Error('Waiver is not signed yet'))
      const res = await POST(makeRequest({ action: 'check_in', waiver_id: WAIVER_UUID }))
      expect(res.status).toBe(409)
    })

    it('returns 500 for unexpected errors', async () => {
      ;(checkInWaiver as jest.Mock).mockRejectedValue(new Error('DB down'))
      const res = await POST(makeRequest({ action: 'check_in', waiver_id: WAIVER_UUID }))
      expect(res.status).toBe(500)
    })
  })

  describe('undo_check_in', () => {
    it('clears the check-in', async () => {
      ;(undoCheckIn as jest.Mock).mockResolvedValue({ id: 'w1', checked_in_at: null })
      const res = await POST(makeRequest({ action: 'undo_check_in', waiver_id: WAIVER_UUID }))
      expect(res.status).toBe(200)
      expect(undoCheckIn).toHaveBeenCalledWith(WAIVER_UUID)
    })
  })
})
