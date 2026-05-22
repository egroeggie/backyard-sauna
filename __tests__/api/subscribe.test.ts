/**
 * @jest-environment node
 */

const mockFetch = jest.fn()
global.fetch = mockFetch

import { POST } from '@/app/api/subscribe/route'

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.MAILCHIMP_API_KEY = 'test-api-key'
    process.env.MAILCHIMP_AUDIENCE_ID = 'aud123'
    process.env.MAILCHIMP_SERVER_PREFIX = 'us18'
  })

  const makeRequest = (body: object) =>
    new Request('http://localhost/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(body),
    })

  it('returns 400 if email is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Email required')
  })

  it('returns success when Mailchimp responds ok', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    const res = await POST(makeRequest({ email: 'test@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns 400 with friendly message when member already exists', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ title: 'Member Exists' }),
    })
    const res = await POST(makeRequest({ email: 'existing@example.com' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('already subscribed')
  })

  it('returns 500 on other Mailchimp errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ title: 'Internal Server Error' }),
    })
    const res = await POST(makeRequest({ email: 'test@example.com' }))
    expect(res.status).toBe(500)
  })

  it('hits the correct Mailchimp endpoint with correct auth', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    await POST(makeRequest({ email: 'test@example.com' }))

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://us18.api.mailchimp.com/3.0/lists/aud123/members')
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toMatch(/^Basic /)

    const decoded = Buffer.from(options.headers.Authorization.replace('Basic ', ''), 'base64').toString()
    expect(decoded).toBe('anystring:test-api-key')
  })

  it('sends the email address in the request body', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
    await POST(makeRequest({ email: 'hello@example.com' }))

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.email_address).toBe('hello@example.com')
    expect(body.status).toBe('subscribed')
  })
})
