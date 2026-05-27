export async function subscribeToMailchimp(email: string): Promise<void> {
  const apiKey = process.env.MAILCHIMP_API_KEY?.trim()
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID?.trim()
  const server = process.env.MAILCHIMP_SERVER_PREFIX?.trim()

  await fetch(`https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email, status: 'subscribed' }),
  })
}
