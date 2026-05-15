const mockOrder = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockSelect = jest.fn()

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({ select: mockSelect }),
  }),
}))

import { getPublishedEvents, getEventById } from '@/lib/db/events'

describe('getPublishedEvents', () => {
  it('filters by is_published and orders by date', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: [], error: null }),
      }),
    })
    await getPublishedEvents()
    expect(mockEq).toHaveBeenCalledWith('is_published', true)
    expect(mockOrder).toHaveBeenCalledWith('date', { ascending: true })
  })

  it('throws on DB error', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: null, error: { message: 'fail' } }),
      }),
    })
    await expect(getPublishedEvents()).rejects.toThrow('fail')
  })
})

describe('getEventById', () => {
  it('queries by id and returns single row', async () => {
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle.mockResolvedValue({ data: { id: 'e1' }, error: null }),
      }),
    })
    const result = await getEventById('e1')
    expect(mockEq).toHaveBeenCalledWith('id', 'e1')
    expect(result).toEqual({ id: 'e1' })
  })
})
