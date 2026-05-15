import { Resend } from 'resend'
import { render } from '@react-email/render'
import { ConfirmationEmail } from '@/emails/confirmation'
import { ReminderEmail } from '@/emails/reminder'
import { WaiverConfirmationEmail } from '@/emails/waiver-confirmation'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Backyard Sauna <hello@backyardsauna.co.uk>'
const REPLY_TO = 'stockportsauna@gmail.com'
const devOverride = process.env.NODE_ENV === 'development' ? process.env.DEV_EMAIL_OVERRIDE : undefined

export async function sendConfirmationEmail(p: {
  to: string; name: string; eventTitle: string; eventDate: string
  slotStartTime: string; slotEndTime: string; location: string
  spaces: number; waiverLinks: string[]
}) {
  const html = await render(ConfirmationEmail(p))
  return resend.emails.send({ from: FROM, replyTo: REPLY_TO, to: devOverride ?? p.to, subject: `You're booked: ${p.eventTitle}`, html })
}

export async function sendReminderEmail(p: {
  to: string; name: string; eventTitle: string; eventDate: string
  slotStartTime: string; slotEndTime: string; location: string
  unsignedWaiverLinks: string[]
}) {
  const html = await render(ReminderEmail(p))
  return resend.emails.send({ from: FROM, replyTo: REPLY_TO, to: devOverride ?? p.to, subject: `Reminder: ${p.eventTitle} is tomorrow`, html })
}

export async function sendWaiverConfirmationEmail(p: {
  to: string; name: string; eventTitle: string; eventDate: string
}) {
  const html = await render(WaiverConfirmationEmail(p))
  return resend.emails.send({ from: FROM, replyTo: REPLY_TO, to: devOverride ?? p.to, subject: `Waiver signed: ${p.eventTitle}`, html })
}
