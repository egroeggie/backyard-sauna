import { Resend } from 'resend'
import { render } from '@react-email/render'
import { ConfirmationEmail } from '@/emails/confirmation'
import { ReminderEmail } from '@/emails/reminder'
import { WaiverConfirmationEmail } from '@/emails/waiver-confirmation'
import { WaiverLinkEmail } from '@/emails/waiver-link'
import { PostAttendanceEmail } from '@/emails/post-attendance'
import { PaymentLinkEmail } from '@/emails/payment-link'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Backyard Sauna <hello@backyard-sauna.com>'
const REPLY_TO = 'hello@backyard-sauna.com'
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

export async function sendPostAttendanceEmail(p: {
  to: string; name: string; eventTitle: string; patreonUrl?: string
}) {
  const html = await render(PostAttendanceEmail(p))
  return resend.emails.send({ from: FROM, replyTo: REPLY_TO, to: devOverride ?? p.to, subject: `Hey hot stuff 🔥`, html })
}

export async function sendWaiverLinkEmail(p: {
  to: string; name?: string; eventTitle: string; eventDate: string; waiverUrl: string
}) {
  const html = await render(WaiverLinkEmail(p))
  return resend.emails.send({ from: FROM, replyTo: REPLY_TO, to: devOverride ?? p.to, subject: `Sign your waiver: ${p.eventTitle}`, html })
}

export async function sendPaymentLinkEmail(p: {
  to: string; name?: string; eventTitle: string; eventDate: string; spaces: number; checkoutUrl: string
}) {
  const html = await render(PaymentLinkEmail(p))
  return resend.emails.send({ from: FROM, replyTo: REPLY_TO, to: devOverride ?? p.to, subject: `Complete your booking: ${p.eventTitle}`, html })
}
