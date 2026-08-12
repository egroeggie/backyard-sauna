import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WaiverManager from '@/app/admin/waivers/WaiverManager'

const groups = [
  {
    key: '2026-08-16__Summer Pop-up',
    date: '2026-08-16',
    title: 'Summer Pop-up',
    waivers: [
      {
        id: 'w1', booking_id: 'b1', name: 'Alice', email: 'alice@test.com', token: 'tok1',
        signed_at: '2026-08-01T00:00:00Z', event_title: null, event_date: null, dob: '1990-01-01',
        resolved_event_title: 'Summer Pop-up', resolved_event_date: '2026-08-16',
        booking_name: 'Alice', booking_email: 'alice@test.com',
      },
      {
        id: 'w2', booking_id: 'b1', name: null, email: null, token: 'tok2',
        signed_at: null, event_title: null, event_date: null, dob: null,
        resolved_event_title: 'Summer Pop-up', resolved_event_date: '2026-08-16',
        booking_name: 'Alice', booking_email: 'alice@test.com',
      },
    ],
  },
]

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('WaiverManager', () => {
  it('renders signed and outstanding sections', () => {
    render(<WaiverManager groups={groups as never} />)
    expect(screen.getByText('Summer Pop-up')).toBeInTheDocument()
    expect(screen.getByText('Outstanding')).toBeInTheDocument()
    expect(screen.getAllByText('Alice')).toHaveLength(2) // booking name (outstanding) + signed row name
    expect(screen.getByText('Mark as signed')).toBeInTheDocument()
  })

  it('marks an outstanding waiver as signed', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'w2', signed_at: '2026-08-12T00:00:00Z' }) })
    global.fetch = fetchSpy as never
    render(<WaiverManager groups={groups as never} />)

    fireEvent.click(screen.getByText('Mark as signed'))
    fireEvent.click(screen.getByText('Confirm signed'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/waivers', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'mark_signed', waiver_id: 'w2', name: undefined, email: undefined, dob: undefined }),
    })))
    await waitFor(() => expect(screen.getByText(/Marked as signed/i)).toBeInTheDocument())
  })

  it('deletes a signed waiver after confirming', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    global.fetch = fetchSpy as never
    render(<WaiverManager groups={groups as never} />)

    // Outstanding section renders first (w2), signed section second (w1) -- index 1 is Alice's signed row
    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[1])
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/waivers', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'delete', waiver_id: 'w1' }),
    })))
  })
})
