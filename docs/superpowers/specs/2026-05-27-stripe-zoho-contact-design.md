# Stripe Live, Zoho Email & Contact Form

**Date:** 2026-05-27  
**Project:** backyard-sauna  

---

## Scope

Three independent changes delivered together:

1. Switch Stripe from test to live mode
2. Send transactional emails from `hello@backyard-sauna.com` via Resend + Zoho
3. Wire up the contact form to deliver messages to `hello@backyard-sauna.com`

---

## 1. Stripe Live Mode

### What changes
- `STRIPE_SECRET_KEY` → `rk_live_...` (restricted live key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- `STRIPE_WEBHOOK_SECRET` → new live webhook secret (see below)

### No code changes required
The existing `lib/stripe.ts` and all API routes read from env vars — swapping the keys is sufficient.

### Webhook re-registration (manual step)
Live-mode webhooks are separate from test-mode in Stripe. The user must:
1. Go to Stripe Dashboard → Developers → Webhooks → **live mode**
2. Add endpoint: `https://www.backyard-sauna.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Copy the new signing secret → update `STRIPE_WEBHOOK_SECRET` on Vercel

### Env vars to update on Vercel (production)
| Var | Value |
|-----|-------|
| `STRIPE_SECRET_KEY` | `rk_live_51TXM9d...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_51TXM9d...` |
| `STRIPE_WEBHOOK_SECRET` | from live webhook registration |

---

## 2. Zoho / Resend Domain

### Goal
Transactional emails (booking confirmations, reminders, waiver confirmations) send **from** `hello@backyard-sauna.com`. Zoho receives them, forwards to `stockportsauna@gmail.com`.

### Approach: Resend domain verification
Resend already handles sending. The only change is verifying `backyard-sauna.com` as a sender domain so Resend can send from `hello@backyard-sauna.com` instead of `onboarding@resend.dev`.

**DNS records to add** (provided by Resend dashboard after adding domain):
- SPF record (TXT on `@` or `backyard-sauna.com`)
- DKIM record (TXT on a Resend-provided subdomain)
- Optional: DMARC TXT record

These are added at the domain registrar (wherever `backyard-sauna.com` DNS is managed).

### Code change — `lib/email.ts`
```ts
// Before
const FROM = 'Backyard Sauna <onboarding@resend.dev>'
const REPLY_TO = 'stockportsauna@gmail.com'

// After
const FROM = 'Backyard Sauna <hello@backyard-sauna.com>'
const REPLY_TO = 'hello@backyard-sauna.com'
```

### Zoho forwarding (manual step)
In Zoho Mail settings for `hello@backyard-sauna.com`, enable forwarding to `stockportsauna@gmail.com`.

---

## 3. Contact Form

### Current state
`app/contact/page.tsx` is a static form with `action="#"` — no submission logic.

### API route: `POST /api/contact`
New file: `app/api/contact/route.ts`

Accepts: `{ name, email, subject, message }`  
Validates: all fields required, email format  
Sends: email via Resend to `hello@backyard-sauna.com`  
Email body includes sender's name, email, subject, and message.  
Returns: `200 { ok: true }` or `400/500` with error message.

### Contact form component
Convert `app/contact/page.tsx` to a client component (`'use client'`).

State: `idle | submitting | success | error`

- On submit: POST to `/api/contact`, show spinner on button
- On success: replace form with a confirmation message ("Thanks, we'll be in touch!")
- On error: show inline error below the button, keep form editable

Styled consistently with the existing `BookingForm` pattern.

### Email format (sent to `hello@backyard-sauna.com`)
```
Subject: Contact form: <subject>

Name: <name>
Email: <email>

<message>
```
Plain text only — no React Email template needed for an internal notification.

---

## Dependencies & Order

1. **Stripe keys** — Vercel env update only, no deploy needed after (env change takes effect on next request)
2. **Resend domain** — DNS change (propagation ~15 min), then code update to `lib/email.ts`, then deploy
3. **Contact form** — API route + component update, then deploy

Steps 2 and 3 can be deployed together in a single commit.

---

## What is NOT in scope

- Zoho SMTP as a sending provider (Resend handles sending; Zoho is receive-only)
- Email template redesign for existing transactional emails
- Stripe product/price reconfiguration
