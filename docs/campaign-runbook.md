# Permanent-venue campaign: runbook

Everything you can change without touching code is in **`config/campaign.ts`**: milestones, primary target,
offline adjustment, start date, tiers, tier notes, refund policy and the pop-up pause switch.

## 1. Go live in Stripe (you run this; I haven't touched live mode)

Test mode is already set up (7 products and prices, tagged `metadata.campaign = permanent-venue`, `metadata.tier = <id>`).

```bash
# 1. Dry run against LIVE (read-only, shows what it would do)
STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-campaign-tiers.mjs

# 2. Create the live products and prices (refuses live mode without --live)
STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-campaign-tiers.mjs --apply --live

# 3. Re-run the dry run: every tier should show ✓
STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-campaign-tiers.mjs
```

Needs Node 22.18 or later. It is safe to run more than once. It never deletes anything.

- **No new env vars are needed.** The site finds each tier's price by *lookup key* (`permanent-venue:<tier-id>`),
  so test and live resolve their own price IDs automatically. Price IDs aren't hard-coded anywhere.
- **Old tiers (£5/£15/£30/£50/custom):** these were never Products or Prices in Stripe. The old checkout built an
  inline price for each payment, and Stripe archives those automatically. So there is nothing to archive, and the
  script confirms that. Old payments are untouched.
- Do this **before** merging. Until the live prices exist, live checkout shows "Checkout is not set up yet"
  (it never charges the wrong amount, because the price must match `config/campaign.ts`).

## 2. Check the live total yourself

```bash
STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-campaign-tiers.mjs --report
```

This lists every campaign payment since `startDate` (tier, amount, refunds, currency, Checkout Session ID) and
prints a net total plus a backer count, computed independently of the site. Add `offlineAdjustment` and it should
equal `raised` and `backers` from `https://<preview-or-live>/api/campaign-progress`. The same list is how you see
**pre-existing backers on the old tiers** (rows marked `legacy`).

## 3. What counts towards the total

| Counted | Not counted |
|---|---|
| Checkout Sessions with `metadata.campaign = permanent-venue` (all new checkouts) | Anything with `metadata.booking_id` (pop-up bookings, including admin payment links) |
| Older contributions with `metadata.tier_name` (the old `/api/contribute` only ever set this, from 2026-06-03) | Unpaid or expired sessions, failed charges |
| Net of refunds (partial refunds are subtracted; full refunds count £0 and don't count as a backer) | Payments before `startDate` |
| GBP prices paid in another currency through Adaptive Pricing count at their original GBP amount | |

Backers are unique by email (case-insensitive), then by Stripe customer.
New checkouts switch Adaptive Pricing off, so they are always charged in GBP.

Totals are cached for 5 minutes. If Stripe can't be reached the site keeps showing the last good figure. If it has
never had one, the page says the total is unavailable. It never shows £0 because of an error.

**Optional:** in Stripe → Webhooks, add `charge.refunded` and `charge.dispute.closed` to the existing endpoint so
refunds show up straight away instead of within 5 minutes. A completed contribution already triggers a refresh.

## 4. Before the refund wording goes live

`refundPolicy` in `config/campaign.ts` is `null`. On previews, /support/takepart shows a red TODO box.
On production (`VERCEL_ENV=production`) the whole "What if the venue doesn't open?" block is hidden.
Set it to the agreed wording to publish it.

## 5. Pop-ups

`popups.paused = true` in `config/campaign.ts`:
- /events shows the pause notice, and /events/<id> redirects to /events
- `POST /api/bookings` returns 410
- the reminder and post-attendance crons send nothing (so 6 Dec bookers won't get a "see you tomorrow" email)
- /rental redirects to /events (`next.config.ts`) and is removed from the nav

Admin pages are untouched, so you can still see and refund bookings. After merging, it's tidy (but optional) to
**archive** the 29 Nov and 6 Dec events in /admin/events.

To bring the pop-ups back: set `paused: false`, and remove the `/rental` redirect if tent hire returns.
