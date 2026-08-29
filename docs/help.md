# Help Center

## Purpose

Public and signed-in Help Center at `/help`: searchable guides plus a contact form. Requests email the support inbox and store a ticket for signed-in users.

## Description

- `/help` is **not** a protected route. Guests see marketing chrome; signed-in users see the app shell (sidebar Help, More sheet Help).
- Articles: product guides in `messages/en.json` (`help.guides`) plus the landing FAQ (`faq.items`). Client-side search filters title, body, and category.
- `POST /api/help`: origin check (`handleRoute`), rate limits `help-contact-ip` and `help-contact-email` (5 / 15 minutes), validates name / email / topic / message (max 4000 chars, control characters stripped).
- Delivery: Resend HTTP API. After `connection()`, the key is found by scanning `process.env` keys that match `/resend/i` for a `re_…` value (webpack cannot inline that). Skip logs include `resendNames` (names only). From is `EMAIL_FROM_HELP` when it is a real mailbox; the example `help@puyer.org` value uses `Puyer Help <EMAIL_FROM>` instead. Inbox `HELP_INBOX` (else `EMAIL_FROM` mailbox, else `support@puyer.org`). `replyTo` is the submitter. Skipped Resend (missing key/from) is a 400. Message bodies are not logged.
- Persistence: `SupportRequest` (OPEN/CLOSED). Optional `userId` / `organizationId` when signed in. RLS: authenticated users may select rows where `userId = auth.uid()`; writes go through Prisma (`puyer_prisma`).

Re-checked Context7 `/vercel/next.js/v16.2.9` (`connection()` for runtime `process.env`) and `/websites/resend` on 2026-08-29.

## How to use

1. Apply [`supabase/migrations/20260829200000_support_requests.sql`](../supabase/migrations/20260829200000_support_requests.sql). `npx prisma generate`.
2. Production: Vercel `RESEND_API_KEY` on **Production** (and Preview if you test there), then **Redeploy**. Magic-link SMTP in Supabase is not this key. `EMAIL_FROM` must be a verified Resend domain. `help@puyer.org` is optional; if it is not verified, Help uses the `EMAIL_FROM` mailbox. Set `HELP_INBOX` if the mailbox is not `support@puyer.org`.
3. Open `/help`, search articles, or send a request.

## Examples

- Guest POST with a valid form → 200, inbox + ack emails when Resend is configured.
- Sixth POST from the same IP in 15 minutes → 429.
- POST without Resend → 400 (`Your request could not be sent…`).
- Signed-out `/help` stays on `/help` (not `/login`).

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Playwright `e2e/pay-path.spec.ts` loads `/help` as a public page.

## Limitations

- There is no agent inbox UI for staff; they work from email (`replyTo`).
- Guests do not see a ticket history.
- Help copy is English only.
- `help@puyer.org` is optional. Unverified `help@` with a copied `.env.example` value used to skip or fail send; Help now uses `EMAIL_FROM` in that case.

## Modules

- `app/help/page.tsx`, `components/help/help-screen.tsx`, `app/api/help/route.ts`
- `lib/help/**`, `lib/email/index.ts`, `lib/email/resend.ts`, `lib/email/env.ts`
- `prisma/schema.prisma`, `supabase/migrations/20260829200000_support_requests.sql`
- `messages/en.json` (`help`, `dashboard.nav.help`, `header.help`, `footer.help`)

## Version

1.0.4 — 2026-08-29

## Changelog

```
[2026-08-29] – Fixed: Resend API key is discovered by scanning env names for a `re_` value; skip logs list Resend env names.
[2026-08-29] – Fixed: Resend reads `RESEND_API_KEY` via `node:process.env` so Vercel Sensitive keys are not inlined empty at build.
[2026-08-29] – Fixed: Help/Resend uses static `process.env.RESEND_API_KEY` after `connection()` so Vercel injects the key into `/api/help`.
[2026-08-29] – Fixed: Help email reads Resend at request runtime and sends from the verified EMAIL_FROM mailbox when help@ is only the example value.
[2026-08-29] – Added: Help Center with searchable articles, contact form, SupportRequest table, and Resend inbox/ack mail.
```
