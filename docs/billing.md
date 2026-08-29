# Platform subscriptions (Phase 5, Domain A)

## Purpose

Sell **Puyer** Pro and Business on the **platform** Stripe account. This is a separate money path from invoice payments (Domain B / Connect). Entitlements flip on **platform webhooks**, not on `/billing/success`.

## Description

- Checkout: `mode: "subscription"` with **no** `stripeAccount` header, **no** `application_fee_amount`, destination charges, or transfers.
- Idempotency: `sub_create:{organizationId}:{priceId}`.
- Customer Portal manages the Puyer subscription only (`customer` + `return_url`). Never `on_behalf_of` / connected-account customers.
- `Subscription` + `SubscriptionEvent` store Stripe Billing state. `Organization.plan` is denormalized from `effectivePlan()`.
- `past_due` keeps Pro/Business for **7 days** after `currentPeriodEnd`, then locks to Free.
- `/billing/success` is UX copy only (`billingRedirectIsAuthoritative() === false`).
- Server `requireEntitlement` gates Connect onboarding. Public Pay returns a generic “unavailable” message if the workspace is Free (no upgrade leak).
- Connect `customer.subscription.*` events are ignored so they cannot update `Organization.plan`.

Pinned Stripe API version: `2026-02-25.clover`. Re-checked Context7 `/stripe/stripe-node` and `/vercel/next.js/v16.2.9` on 2026-08-28.

## How to use

1. Create Products/Prices in the **platform** Stripe account (test mode). Put price ids in `.env.local`:
   - `STRIPE_PLATFORM_PRICE_PRO` / `STRIPE_PLATFORM_PRICE_PRO_YEARLY`
   - `STRIPE_PLATFORM_PRICE_BUSINESS` / `STRIPE_PLATFORM_PRICE_BUSINESS_YEARLY`
2. Platform webhook: `https://<host>/api/stripe/webhooks/platform` with `STRIPE_WEBHOOK_SECRET_PLATFORM`. Listen to `customer.subscription.*`, `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`.
3. Apply [`supabase/migrations/20260828220000_platform_subscriptions.sql`](../supabase/migrations/20260828220000_platform_subscriptions.sql). Then `npx prisma generate`.
4. Sign in → `/pricing` or `/billing` (owner) → platform Checkout. Return from Checkout does not unlock the plan until the webhook runs.
5. **Manage subscription** opens Stripe Customer Portal and returns to `/billing`.

Local CLI: same `stripe listen` as in [`stripe-connect.md`](./stripe-connect.md) (`--forward-to` platform + `--forward-connect-to` Connect).

## Examples

- Unauthenticated Pro/Business CTA → auth modal (`intent=subscribe`) → `/pricing` → Checkout.
- Authenticated Pro CTA → `POST /api/stripe/platform/checkout` `{ plan: "PRO", interval: "month" | "year" }`.
- Platform `payment_intent.succeeded` (no `event.account`) never marks a Puyer invoice paid.
- Connect `customer.subscription.updated` is ignored by the Connect handler.

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Browser:

- `/billing` without price ids: Checkout shows a safe “not configured” error.
- After Checkout + webhook: sidebar plan badge is Pro/Business; Settings allows Connect Stripe.
- `/billing/success` still shows Free until the webhook writes `Subscription`.

## Limitations

- Price ids are env-mapped; there is no Stripe Price catalog in the database.
- In-process rate limits on Checkout/Portal (Upstash in Phase 9).
- Automatic reminders still send in Phase 6; this phase only gates the Overview CTA and future engines.
- Teams are live on `/team` (Business invite). Advanced reports are live on `/reports`.
- Yearly prices are optional; missing yearly env returns a validation error if the user toggles yearly.

## Modules

- `lib/stripe/platform/**`, `lib/entitlements/**`, `lib/stripe/webhooks/ingest.ts`
- `app/api/stripe/platform/**`, `app/(dashboard)/billing/**`
- `components/dashboard/billing-settings.tsx`, `components/marketing/pricing-section.tsx`
- `prisma/schema.prisma`, `supabase/migrations/20260828220000_platform_subscriptions.sql`

## Version

1.0.2 — 2026-08-29

## Changelog

```
[2026-08-28] – Changed: Local webhook CLI points at the combined listen command in stripe-connect.md.
[2026-08-28] – Added: Platform subscription Checkout, Customer Portal, webhook sync, entitlement matrix, Billing UI, pricing Checkout.
[2026-08-28] – Changed: Reports are live; Billing upgrade copy no longer says base reports are pending.
[2026-08-28] – Changed: Team invites are live for Business.
[2026-08-29] – Changed: Public pricing UI is Phosphor cards + Monthly/Yearly segments; Checkout contract is unchanged.
```
