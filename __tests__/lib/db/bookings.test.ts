const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({ insert: mockInsert, update: mockUpdate, select: mockSelect }),
  }),
}))

import { createPendingBooking, confirmBooking } from '@/lib/db/bookings'

describe('createPendingBooking', () => {
  it('inserts with status pending', async () => {
    mockInsert.mockReturnValue({
      select: mockSelect.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: { id: 'b1', status: 'pending' }, error: null }),
      }),
    })
    const result = await createPendingBooking({
      slot_id: 's1', name: 'Alice', email: 'alice@test.com', spaces: 2, waiver_accepted: true,
    })
    expect(result.status).toBe('pending')
  })
})

describe('confirmBooking', () => {
  it('updates status to confirmed with stripe payment id', async () => {
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({
            data: { id: 'b1', status: 'confirmed', stripe_payment_id: 'pi_123' }, error: null,
          }),
        }),
      }),
    })
    const result = await confirmBooking('b1', 'pi_123')
    expect(result.status).toBe('confirmed')
    expect(result.stripe_payment_id).toBe('pi_123')
  })
})
