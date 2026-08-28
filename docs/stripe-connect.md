# Stripe Connect (Phase 4, Domain B)

## Purpose

Let a workspace connect **their** Stripe account and collect invoice payments as **direct charges** on that account. Puyer never takes `application_fee_amount`, destination charges, or transfers. Puyer revenue is Pro/Business on the **platform** account (see [`billing.md`](./billing.md)).

## Description

- Connected accounts are created with Accounts v2: `dashboard: "full"`, `fees_collector: "stripe"`, `losses_collector: "stripe"`, merchant `card_payments` only. **No** `configuration.recipient` / `stripe_transfers`.
- Onboarding uses Account Links v2 (`use_case.type = account_onboarding`, `configurations: ["merchant"]`). Return to `/settings` is UX only; `account.updated` (and a server retrieve) is the source of truth for `CONNECTED` / `ACTION_REQUIRED`.
- Public **Pay Invoice** creates Checkout `mode: "payment"` with `{ stripeAccount: connectedAccountId }`. Success URL query `?checkout=success` does **not** mark the invoice paid.
- Connect webhook: `POST /api/stripe/webhooks/connect`. Platform webhook: `POST /api/stripe/webhooks/platform`. Separate secrets. Events with `event.account` are Connect; the platform handler never marks a Puyer invoice paid.
- `InvoicePayment` is a read model. Refunds and disputes are displayed; the business manages them in Stripe.
- Webhook processing is inline after signature verification (Inngest enqueue is Phase 6). Duplicate `eventId` returns 200.

Pinned Stripe API version: `2026-02-25.clover` (`stripe` Node SDK 20). Re-checked Context7 `/websites/stripe` and `/stripe/stripe-node` on 2026-08-28.

## How to use

1. Add test-mode `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET_CONNECT` (and platform secret for the second endpoint) to `.env.local`.
2. Stripe Dashboard → Developers → Webhooks:
   - Connect endpoint: `https://<host>/api/stripe/webhooks/connect` (listen to `account.updated`, `checkout.session.*`, `payment_intent.*`, `charge.refunded`, `charge.dispute.created`). Enable **Connect** events.
   - Platform endpoint: `https://<host>/api/stripe/webhooks/platform` (Puyer subscriptions; see [`billing.md`](./billing.md)).
3. Sign in → **Settings** → **Connect Stripe** (owner). Complete hosted onboarding.
4. Share `/invoice/{publicId}` → customer **Pay Invoice**.
5. **Payments** lists synchronized charges with copy that money went to the connected account.

Local CLI (test mode, both endpoints in one process):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks/platform --forward-connect-to localhost:3000/api/stripe/webhooks/connect
```

Paste the printed `whsec_...` into both `STRIPE_WEBHOOK_SECRET_PLATFORM` and `STRIPE_WEBHOOK_SECRET_CONNECT`. Production Dashboard endpoints each have their own secret. Use `--live` only when forwarding live-mode events to a local server (real money).

SQL: [`supabase/migrations/20260828210000_stripe_connect_domain.sql`](../supabase/migrations/20260828210000_stripe_connect_domain.sql). Then `npx prisma generate`.

## Examples

- Checkout JSON never contains `application_fee_amount` or `transfer_data`.
- Platform `payment_intent.succeeded` (no `event.account`) is ignored for invoices.
- Duplicate Stripe `eventId` is stored once; second delivery is a no-op 200.

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Browser:

- Settings without keys: Connect shows a safe “not configured” error. The page itself must still render (no Vercel digest crash) so Sign out stays available.
- After Connect + webhook: public Pay redirects to Stripe Checkout branded as the connected business.
- Return from Checkout with `?checkout=success` still shows unpaid until the webhook runs.

## Limitations

- Connect onboarding requires entitlement `STRIPE_PAYMENTS` (Pro/Business). Public Pay stays generic “unavailable” on Free.
- No refunds API. Customer Portal and platform subscriptions live in Domain A ([`billing.md`](./billing.md)).
- WebhookEvent has RLS enabled and **no** authenticated policies on purpose (server-only; Prisma `puyer_prisma` has grants + BYPASSRLS). The linter INFO `rls_enabled_no_policy` is expected.
- Identity country defaults to `US` on onboard; Stripe onboarding collects the rest.

## Modules

- `lib/stripe/**`, `lib/payments/**`, `lib/entitlements/index.ts`
- `app/api/stripe/**`, `app/api/public/invoices/[publicId]/pay/route.ts`
- `app/(dashboard)/settings/page.tsx`, `app/(dashboard)/payments/page.tsx`
- `components/dashboard/stripe-settings.tsx`, `components/invoice/public-pay-panel.tsx`
- `prisma/schema.prisma`, `supabase/migrations/20260828210000_stripe_connect_domain.sql`

## Version

1.0.4 — 2026-08-28

## Changelog

```
[2026-08-28] – Changed: Local CLI listens with `--forward-to` (platform) and `--forward-connect-to` (Connect).
[2026-08-28] – Added: Stripe Connect onboarding, direct-charge Checkout, Connect/platform webhooks, InvoicePayment sync, Payments list, public Pay button.
[2026-08-28] – Changed: Connect onboarding and public Pay enforce `STRIPE_PAYMENTS`.
[2026-08-28] – Changed: §17 checklist mapped; webhook IP rate limit (Phase 9).
[2026-08-28] – Changed: Public payer page uses document + pay sidebar.
[2026-08-28] – Fixed: Settings Stripe lookup failures no longer crash the page.
```
