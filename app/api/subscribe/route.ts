import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const apiKey = process.env.MAILCHIMP_API_KEY?.trim()
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID?.trim()
  const server = process.env.MAILCHIMP_SERVER_PREFIX?.trim()

  const res = await fetch(`https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email, status: 'subscribed' }),
  })

  const data = await res.json()

  if (res.ok) return NextResponse.json({ success: true })
  if (data.title === 'Member Exists') return NextResponse.json({ error: 'You\'re already subscribed!' }, { status: 400 })
  console.error('[subscribe] Mailchimp error:', JSON.stringify(data))
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
