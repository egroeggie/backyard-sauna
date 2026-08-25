type TableName = 'slots' | 'bookings' | 'events' | 'waiver_signatures'

const responses: Record<TableName, unknown> = {
  slots: { data: [], error: null },
  bookings: { count: 0, error: null },
  events: { data: { id: 'e1', title: 'Summer Pop-up', date: '2026-08-16' }, error: null },
  waiver_signatures: { count: 0, error: null },
}

function makeChain(table: TableName) {
  const chain: Record<string, unknown> = {}
  const terminal = () => Promise.resolve(responses[table])
  chain.select = jest.fn(() => chain)
  chain.eq = jest.fn(() => chain)
  chain.in = jest.fn(() => chain)
  chain.is = jest.fn(() => chain)
  chain.not = jest.fn(() => chain)
  chain.single = jest.fn(terminal)
  chain.then = (resolve: (v: unknown) => unknown) => terminal().then(resolve)
  return chain
}

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: TableName) => makeChain(table),
  }),
}))

import { eventHasHistory } from '@/lib/db/events'

describe('eventHasHistory', () => {
  beforeEach(() => {
    responses.slots = { data: [], error: null }
    responses.bookings = { count: 0, error: null }
    responses.events = { data: { id: 'e1', title: 'Summer Pop-up', date: '2026-08-16' }, error: null }
    responses.waiver_signatures = { count: 0, error: null }
  })

  it('returns false when the event has no slots, bookings, or walk-in waivers', async () => {
    await expect(eventHasHistory('e1')).resolves.toBe(false)
  })

  it('returns true when a slot has bookings', async () => {
    responses.slots = { data: [{ id: 's1' }], error: null }
    responses.bookings = { count: 2, error: null }
    await expect(eventHasHistory('e1')).resolves.toBe(true)
  })

  it('returns false when slots exist but have zero bookings', async () => {
    responses.slots = { data: [{ id: 's1' }], error: null }
    responses.bookings = { count: 0, error: null }
    await expect(eventHasHistory('e1')).resolves.toBe(false)
  })

  it('returns true when there is a signed walk-in waiver for the event', async () => {
    responses.waiver_signatures = { count: 1, error: null }
    await expect(eventHasHistory('e1')).resolves.toBe(true)
  })
})
