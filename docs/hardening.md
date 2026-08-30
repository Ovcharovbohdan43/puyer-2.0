# Hardening (Phase 9)

## Purpose

Rate-limit every listed surface, validate uploads before they touch Storage, keep logs free of secrets, add load-conscious indexes, and cover the public signup → invoice → pay path in Playwright.

## Description

- Rate limits: named policies in `lib/rate-limit/policies.ts`. In-process sliding window by default. If `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, a fixed-window `INCR`/`EXPIRE NX` pipeline is used (Context7 `/websites/upstash_redis`, 2026-08-28). Redis errors fail open to in-process memory so Stripe webhooks are not blocked by an outage.
- Surfaces: magic link (email + IP), **password login**, public invoice GET, public PDF, auth PDF, pay session, invoice/client writes, send/share mark-sent, **manual reminder**, team, **help contact**, notifications, Connect/platform Stripe, webhooks (300/min/IP so Stripe retries still succeed), **logo upload**, **platform admin bans**, **account profile/email/password/deletion**.
- CSRF: mutating requests with an `Origin` header must match the request host or `NEXT_PUBLIC_APP_URL`. Missing Origin (webhooks, curl) is allowed.
- Uploads: `lib/uploads/validate.ts` — JPEG/PNG/WebP, 2 MB, sanitized names, magic-byte sniff. `POST /api/logos` writes to public `org-logos` after that gate (service role).
- Logs: JSON lines, secret field names (including IBAN/bank keys), and `sk_` / `pk_` / `whsec_` / `Bearer` values redacted. API errors include `x-request-id`.
- Indexes: pending invites, unread-style notification list `(userId, organizationId, createdAt)`, open invoices by `dueDate` for reminder sweep.
- Playwright: `e2e/pay-path.spec.ts` walks landing → `/login` → pricing → `/team` login redirect → public invoice 404 (no ID leak) → pay API 404. Optional `E2E_PUBLIC_INVOICE_ID` also checks Pay and dark-theme contrast on the payer portal.

## How to use

```bash
npm run test
npm run test:e2e
npx playwright install chromium   # first local e2e run
```

Set Upstash env vars in production so limits share across serverless instances.

## Examples

- 21st public pay POST in one minute → 429.
- POST `/api/clients` with `Origin: https://evil.example` → 403.
- POST `/api/invoices/[id]/remind` and `/status` use origin check plus `invoice-send` / `invoice-write` limits.
- `logger.info("x", { key: "sk_test_…" })` writes `[redacted]`.

## How to test

Unit: Vitest policies, origin, upload sniff, logger redaction, Stripe §17 fixtures.

E2E: `npm run test:e2e`. Magic-link completion needs a real inbox; CI does not send mail. Stripe Checkout click needs `E2E_PUBLIC_INVOICE_ID` of a SENT test-mode invoice.

## Limitations

- In-process limits do not share across instances (same as before, unless Upstash is configured).
- Logo files are validated and stored in `org-logos` when `SUPABASE_SERVICE_ROLE_KEY` is set.
- Playwright does not complete magic-link signup or a live Stripe Checkout without extra env.

## Modules

- `lib/rate-limit/**`, `lib/http/origin.ts`, `lib/uploads/validate.ts`, `lib/observability/logger.ts`
- `proxy.ts`, `app/api/**`, `lib/stripe/webhooks/http.ts`
- `supabase/migrations/20260828260000_hardening_indexes.sql`
- `e2e/pay-path.spec.ts`, `playwright.config.ts`

## Version

1.0.9 — 2026-08-30

## Changelog

```
[2026-08-30] – Added: Account settings and password-login rate limits.
[2026-08-30] – Added: `platform-admin` limit for Trust & Safety bans.
[2026-08-30] – Added: `logo-upload` limit and Storage write for `POST /api/logos`.
[2026-08-29] – Added: `help-contact-ip` and `help-contact-email` limits for `POST /api/help`.
[2026-08-29] – Changed: Invoice remind/status routes share origin and send/write limits.
[2026-08-29] – Changed: Client PATCH/DELETE share origin and `client-write` limits.
[2026-08-28] – Added: Shared rate-limit policies (Upstash optional), origin check, upload validation, log redaction, load indexes, Playwright pay-path smoke.
[2026-08-28] – Changed: Optional E2E_PUBLIC_INVOICE_ID also asserts dark-theme contrast on the payer portal.
[2026-08-28] – Changed: Playwright login smoke expects `/login` instead of `/?login=1`.
[2026-08-29] – Changed: Logger also redacts IBAN / bank-account field names.
```
