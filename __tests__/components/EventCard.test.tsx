import { render, screen } from '@testing-library/react'
import { EventCard } from '@/components/EventCard'
import type { Event } from '@/types'

const mockEvent: Event = {
  id: 'e1', title: 'Summer Pop-up', date: '2026-07-15',
  location: "Robinson's Brewery Yard", description: 'A great session.',
  image_url: null, price_pence: 1400, is_published: true, archived: false, created_at: '2026-01-01T00:00:00Z',
}

describe('EventCard', () => {
  it('renders title and formatted date', () => {
    render(<EventCard event={mockEvent} />)
    expect(screen.getByText('Summer Pop-up')).toBeInTheDocument()
    expect(screen.getByText(/15 July 2026/i)).toBeInTheDocument()
  })

  it('renders price in pounds', () => {
    render(<EventCard event={mockEvent} />)
    expect(screen.getByText(/£14/)).toBeInTheDocument()
  })

  it('links to event detail page', () => {
    render(<EventCard event={mockEvent} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/events/e1')
  })
})
