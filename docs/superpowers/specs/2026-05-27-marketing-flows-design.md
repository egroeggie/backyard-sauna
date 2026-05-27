# Marketing & Contribution Flows — Design Spec
**Date:** 2026-05-27  
**Status:** Approved  
**Project:** Backyard Sauna (`~/backyard-sauna`)

---

## Overview

Expand the post-booking experience into a full community and fundraising funnel:

1. Replace the reminder email with a "what to bring" email containing practical arrival info
2. Add a post-attendance email prompting Patreon follows and direct contributions
3. Add a `/support/takepart` contribution page with fixed tiers + free-text amount via Stripe
4. Set up Mailchimp welcome + crowdfunding nurture automations (manual, Mailchimp UI)

The crowdfunding goal is a permanent venue for Backyard Sauna Ltd in Stockport. Patreon is free to follow — vlog/blog, site search updates, funding targets. Direct contributions go through the site via Stripe with tiered rewards (rewards TBD before go-live).

---

## 1. Email Templates

### 1a. Updated `emails/reminder.tsx`

Title stays "Reminder: {eventTitle} is tomorrow". Content replaced with three sections:

- **What to bring** — bulleted list (towel, flip flops, swimwear, water bottle, etc.) — *copy TBD by George before go-live*
- **Your booking** — event title, date, time slot, location (same as current)
- **Arrival instructions** — practical info for finding/entering the venue — *copy TBD by George before go-live*
- **Unsigned waivers** — existing logic unchanged; only shown if waivers remain unsigned

Props interface unchanged. No data model changes required.

### 1b. New `emails/post-attendance.tsx`

Sent to confirmed attendees ~2 hours after their slot ends.

- Subject: `"Hey hot stuff 🔥"` (or without emoji — confirm before go-live)
- Opener: `"Hey hot stuff,"`
- Body: short warm message thanking them for coming, teasing the journey ahead
- **CTA 1:** Free Patreon follow — link to Patreon page (*URL TBD — add when Patreon is created*)
- **CTA 2:** Back the campaign — link to `https://www.backyard-sauna.com/support/takepart`
- Footer: standard Backyard Sauna sign-off

---

## 2. Cron Jobs

### 2a. Updated `/api/cron/reminders`

No structural changes. Swap `sendReminderEmail` call for `sendWhatToBringEmail` (renamed export from updated `emails/reminder.tsx`). Auth, schedule, and `reminder_log` deduplication all unchanged.

### 2b. New `/api/cron/post-attendance`

**Schedule:** Hourly — `"0 * * * *"` in `vercel.json`  
**Auth:** Same `CRON_SECRET` bearer token pattern  

**Logic:**
1. Calculate window: slots with `end_time` between 2h and 26h ago (catches any slot since last hourly run, with buffer)
2. For each slot in window, fetch confirmed bookings
3. For each booking, check `attendance_email_log` — skip if already sent
4. Send post-attendance email to `booking.email`
5. Insert row into `attendance_email_log`

**Edge cases:**
- Booking cancelled after slot end: skip (status check)
- Slot end_time is time-only; combine with `events.date` for full datetime comparison

---

## 3. Database

### New table: `attendance_email_log`

```sql
CREATE TABLE attendance_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  sent_at timestamptz DEFAULT now()
);
```

Mirrors `reminder_log`. `ON DELETE SET NULL` so records survive booking deletion.

---

## 4. `/support/takepart` Page

New page under `/app/support/takepart/page.tsx`. Matches site design (dark green `#1f3e2a`, yellow `#edea5a`).

**Content:**
- Heading + short campaign pitch — *copy TBD by George before go-live*
- Fixed contribution tiers (amounts TBD, rewards TBD before go-live) — displayed as selectable cards
- Free-text "other amount" input (minimum £1)
- "Back the sauna" button → calls `/api/contribute` → redirects to Stripe Checkout
- Success state on return: "Thank you" message on same page

**Tier card structure (placeholder):**
- £X — reward description TBD
- £X — reward description TBD  
- £X — reward description TBD
- Other: free text input

### New `/api/contribute` route

```
POST /api/contribute
Body: { amount_pence: number }
```

- Validates `amount_pence >= 100` (£1 minimum)
- Creates Stripe Checkout session (`mode: "payment"`, no booking metadata)
- `success_url`: `/support/takepart?success=true`
- `cancel_url`: `/support/takepart`
- Returns `{ checkoutUrl }`

No booking record created. No waiver flow. Pure payment.

---

## 5. Mailchimp Automations (Manual Setup)

Requires upgrading to Mailchimp Essentials (~£10/month). Both automations configured in the Mailchimp UI — no code changes.

### 5a. Welcome automation

Trigger: contact added to audience (via booking checkbox or `/support` form)  
Single email:
- Who Backyard Sauna is and what you're building
- Link to free Patreon follow
- Link to `/support/takepart`

### 5b. Crowdfunding nurture sequence

3–4 emails sent over 2–4 weeks after signup:
1. "The journey" — origin story, vision for the permanent venue
2. Fundraising target update — where you are, what it unlocks
3. Site search update — what you've looked at, what you're looking for
4. The ask — direct CTA to `/support/takepart` and Patreon

*All copy written by George in Mailchimp.*

---

## 6. Patreon

Free-to-follow. Set up manually at patreon.com. Content: vlog updates, blog posts, site search diary, funding milestone updates.

**Integration with site:** URL dropped into `emails/post-attendance.tsx` and the Mailchimp welcome email once created. No API integration required.

---

## Implementation Order

1. DB migration — `attendance_email_log` table
2. Update `emails/reminder.tsx` — what to bring + arrival instructions (placeholders)
3. New `emails/post-attendance.tsx`
4. New `/api/cron/post-attendance` route + `vercel.json` schedule entry
5. New `/app/support/takepart/page.tsx` + `/api/contribute` route
6. Deploy
7. Manual: upgrade Mailchimp, set up welcome + nurture automations
8. Manual: create Patreon, add URL to post-attendance email, redeploy

---

## Open Items (before go-live)

| Item | Owner |
|---|---|
| What to bring copy | George |
| Arrival instructions copy | George |
| Contribution tier amounts + reward descriptions | George |
| `/support/takepart` campaign pitch copy | George |
| Patreon URL | George (after account created) |
| Post-attendance email subject emoji — keep or drop? | George |
| Mailchimp Essentials upgrade | George |
| Welcome + nurture email copy | George (in Mailchimp UI) |
