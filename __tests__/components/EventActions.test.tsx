import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventActions } from '@/components/EventActions'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('EventActions', () => {
  it('shows Archive for a non-archived event and Unarchive for an archived one', () => {
    const { rerender } = render(<EventActions id="e1" archived={false} />)
    expect(screen.getByText('Archive')).toBeInTheDocument()
    rerender(<EventActions id="e1" archived={true} />)
    expect(screen.getByText('Unarchive')).toBeInTheDocument()
  })

  it('toggles archived via PATCH', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    global.fetch = fetchSpy as never
    render(<EventActions id="e1" archived={false} />)

    fireEvent.click(screen.getByText('Archive'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/events/e1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ archived: true }),
    })))
  })

  it('shows an error and does not proceed when delete is blocked', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      status: 409,
      ok: false,
      json: async () => ({ error: 'Cannot delete: this event has bookings or signed waivers. Archive it instead.' }),
    })
    global.fetch = fetchSpy as never
    render(<EventActions id="e1" archived={false} />)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => expect(screen.getByText(/Archive it instead/i)).toBeInTheDocument())
  })

  it('deletes successfully when there is no history', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ status: 204 })
    global.fetch = fetchSpy as never
    render(<EventActions id="e1" archived={false} />)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/events/e1', { method: 'DELETE' }))
  })
})
