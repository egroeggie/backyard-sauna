/**
 * @jest-environment node
 */

import { POST } from '@/app/api/contact/route'
import { NextResponse } from 'next/server'

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    },
  })),
}))

function makeRequest(body: object) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/contact', () => {
  it('returns 400 if name is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', subject: 'Hi', message: 'Hello' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if email is missing', async () => {
    const res = await POST(makeRequest({ name: 'George', subject: 'Hi', message: 'Hello' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if subject is missing', async () => {
    const res = await POST(makeRequest({ name: 'George', email: 'a@b.com', message: 'Hello' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if message is missing', async () => {
    const res = await POST(makeRequest({ name: 'George', email: 'a@b.com', subject: 'Hi' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 and sends email on valid input', async () => {
    const res = await POST(makeRequest({ name: 'George', email: 'a@b.com', subject: 'Hi', message: 'Hello there' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
