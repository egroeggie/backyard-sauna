import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SlotCapacityEditor from '@/app/admin/events/[id]/SlotCapacityEditor'

const mockSlots = [
  {
    id: 's1',
    start_time: '10:00:00',
    end_time: '11:00:00',
    capacity: 12,
    event_title: 'Summer Pop-up',
    event_date: '2026-08-16',
    bookings: [
      { id: 'b1', name: 'Alice', email: 'alice@example.com', spaces: 2, status: 'confirmed', stripe_payment_id: 'pi_123', waivers: [{ token: 'w1', signed_at: '2026-08-01T00:00:00Z' }, { token: 'w2', signed_at: null }] },
    ],
  },
  {
    id: 's2',
    start_time: '14:00:00',
    end_time: '15:00:00',
    capacity: 12,
    event_title: 'Summer Pop-up',
    event_date: '2026-08-16',
    bookings: [],
  },
]

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('SlotCapacityEditor', () => {
  it('renders session time inputs, capacity, and the add-session control', () => {
    render(<SlotCapacityEditor slots={mockSlots as never} eventId="e1" />)
    expect(screen.getAllByDisplayValue('10:00')).toHaveLength(1)
    expect(screen.getAllByDisplayValue('11:00')).toHaveLength(1)
    expect(screen.getByText('+ Add session')).toBeInTheDocument()
  })

  it('blocks deleting a session that has bookings, without calling the API', () => {
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as never
    render(<SlotCapacityEditor slots={mockSlots as never} eventId="e1" />)

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0]) // slot s1 has a booking

    expect(screen.getByText(/Cannot delete: this session has bookings/i)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('allows deleting an empty session after confirming', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ status: 204, json: async () => ({}) })
    global.fetch = fetchSpy as never
    render(<SlotCapacityEditor slots={mockSlots as never} eventId="e1" />)

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[1]) // slot s2 has no bookings
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/slots/s2', { method: 'DELETE' }))
  })

  it('submits a new session with the correct payload', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'new-slot' }) })
    global.fetch = fetchSpy as never
    render(<SlotCapacityEditor slots={mockSlots as never} eventId="e1" />)

    fireEvent.click(screen.getByText('+ Add session'))
    const timeInputs = screen.getAllByDisplayValue('')
    fireEvent.change(timeInputs[0], { target: { value: '16:00' } })
    fireEvent.change(timeInputs[1], { target: { value: '17:00' } })
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/slots', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ event_id: 'e1', start_time: '16:00', end_time: '17:00', capacity: 12 }),
    })))
    await waitFor(() => expect(screen.getByText(/Session added/i)).toBeInTheDocument())
  })

  it('creates a booking with mark_paid mode by default', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, mode: 'mark_paid' }) })
    global.fetch = fetchSpy as never
    render(<SlotCapacityEditor slots={mockSlots as never} eventId="e1" />)

    const addBookingButtons = screen.getAllByText('+ Add booking')
    fireEvent.click(addBookingButtons[1]) // slot s2

    fireEvent.change(screen.getByPlaceholderText('Name *'), { target: { value: 'Charlie' } })
    fireEvent.change(screen.getByPlaceholderText('Email *'), { target: { value: 'charlie@example.com' } })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/bookings', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ slot_id: 's2', name: 'Charlie', email: 'charlie@example.com', spaces: 1, mode: 'mark_paid' }),
    })))
    await waitFor(() => expect(screen.getByText(/Booked & confirmed/i)).toBeInTheDocument())
  })

  it('creates a booking with payment_link mode when selected', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, mode: 'payment_link', checkoutUrl: 'https://stripe.test/x' }) })
    global.fetch = fetchSpy as never
    render(<SlotCapacityEditor slots={mockSlots as never} eventId="e1" />)

    const addBookingButtons = screen.getAllByText('+ Add booking')
    fireEvent.click(addBookingButtons[1])

    fireEvent.change(screen.getByPlaceholderText('Name *'), { target: { value: 'Dana' } })
    fireEvent.change(screen.getByPlaceholderText('Email *'), { target: { value: 'dana@example.com' } })
    fireEvent.change(screen.getByTitle('Spaces'), { target: { value: '3' } })
    fireEvent.change(screen.getByDisplayValue('Mark as paid'), { target: { value: 'payment_link' } })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/admin/bookings', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ slot_id: 's2', name: 'Dana', email: 'dana@example.com', spaces: 3, mode: 'payment_link' }),
    })))
    await waitFor(() => expect(screen.getByText(/Payment link emailed/i)).toBeInTheDocument())
  })
})
