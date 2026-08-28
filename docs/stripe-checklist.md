# Stripe completion checklist (§17)

Evidence is code + Vitest. Do not treat a green redirect as payment success.

| Requirement | Evidence |
|---|---|
| Direct charges on connected accounts | `buildDirectChargeCheckout` sets `requestOptions.stripeAccount`; test in `lib/stripe/connect/params.test.ts` |
| Connected account is merchant of record | Accounts v2 create + merchant-only Account Link (`assertMerchantOnlyAccountCreate`) |
| Platform does not receive invoice funds | No `application_fee_amount`, `transfer_data`, or destination fields |
| No destination charges / SCT | `payloadContainsForbiddenMoneyFields` |
| No `application_fee_amount` | Same tests; JSON stringify assertion |
| No platform transaction percentage | Direct charge params only; no application fee |
| `fees_collector = stripe` / `losses_collector = stripe` | `buildConnectedAccountCreateParams` + merchant-only assert |
| Refunds/disputes belong to the connected account | Puyer only syncs `InvoicePayment` status (`process-connect`); no refund API |
| Puyer only synchronizes payment status | Connect webhook ingest; public success URL is not authoritative (`checkoutRedirectIsAuthoritative() === false`) |
| Platform Stripe only for Pro/Business | `buildPlatformSubscriptionCheckout` has no `stripeAccount` |
| Two webhook endpoints + isolation | `/api/stripe/webhooks/connect` and `.../platform`; Connect events ignored on platform handler |
| No secret keys exposed | Logger redaction; env-only secrets |
| Signature-verified webhooks | `constructEvent` in `lib/stripe/webhooks/http.ts` |
| Idempotent webhooks | unique `WebhookEvent.eventId` + payload hash |
| Payment success from verified events, not redirects | `checkoutRedirectIsAuthoritative() === false` |
| Official SDK, pinned API version | `stripe` `2026-02-25.clover` in `lib/stripe/version.ts` |

Re-checked Context7 Stripe + Playwright + Upstash REST on 2026-08-28.

## Version

1.0.0 — 2026-08-28

## Changelog

```
[2026-08-28] – Added: Phase 9 mapping of PLAN §17 to tests and handlers.
```
