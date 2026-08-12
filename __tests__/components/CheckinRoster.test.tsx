import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CheckinRoster from '@/app/admin/events/[id]/checkin/CheckinRoster'

const roster = {
  eventTitle: 'Summer Pop-up',
  eventDate: '2026-08-16',
  slots: [
    {
      slotId: 's1', startTime: '10:00:00', endTime: '11:00:00',
      people: [
        { waiverId: 'w1', name: 'Alice', signedAt: '2026-08-01T00:00:00Z', checkedInAt: null },
        { waiverId: 'w2', name: 'Bob', signedAt: '2026-08-01T00:00:00Z', checkedInAt: '2026-08-16T09:00:00Z' },
      ],
    },
  ],
  walkIns: [
    { waiverId: 'w3', name: 'Charlie', signedAt: '2026-08-16T09:30:00Z', checkedInAt: null },
  ],
}

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('CheckinRoster', () => {
  it('renders the roster with arrival counts', () => {
    render(<CheckinRoster roster={roster as never} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.getByText('1/3 arrived')).toBeInTheDocument() // only Bob checked in initially
  })

  it('checks a person in when tapped', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'w1', checked_in_at: '2026-08-16T10:05:00Z' }) })
    global.fetch = fetchSpy as never
    render(<CheckinRoster roster={roster as never} />)

    fireEvent.click(screen.getByText('Alice'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/waivers', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'check_in', waiver_id: 'w1' }),
    })))
    await waitFor(() => expect(screen.getByText('2/3 arrived')).toBeInTheDocument())
  })

  it('undoes a check-in when tapped again', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'w2', checked_in_at: null }) })
    global.fetch = fetchSpy as never
    render(<CheckinRoster roster={roster as never} />)

    fireEvent.click(screen.getByText('Bob')) // Bob starts checked-in

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/waivers', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'undo_check_in', waiver_id: 'w2' }),
    })))
  })

  it('filters people by search text', () => {
    render(<CheckinRoster roster={roster as never} />)
    fireEvent.change(screen.getByPlaceholderText('Search by name…'), { target: { value: 'ali' } })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument()
  })
})
