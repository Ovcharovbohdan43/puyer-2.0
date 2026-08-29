# Help Center

## Purpose

Public and signed-in Help Center at `/help`: searchable guides plus a contact form. Requests email the support inbox and store a ticket for signed-in users.

## Description

- `/help` is **not** a protected route. Guests see marketing chrome; signed-in users see the app shell (sidebar Help, More sheet Help).
- Articles: product guides in `messages/en.json` (`help.guides`) plus the landing FAQ (`faq.items`). Client-side search filters title, body, and category.
- `POST /api/help`: origin check (`handleRoute`), rate limits `help-contact-ip` and `help-contact-email` (5 / 15 minutes), validates name / email / topic / message (max 4000 chars, control characters stripped).
- Delivery: Resend from `Puyer Help <help@puyer.org>` (`EMAIL_FROM_HELP`). Inbox `HELP_INBOX` (default `support@puyer.org`) with `replyTo` the submitter. Acknowledgement email to the submitter. Skipped Resend (missing key/from) is a 400, same idea as team invites. Message bodies are not logged.
- Persistence: `SupportRequest` (OPEN/CLOSED). Optional `userId` / `organizationId` when signed in. RLS: authenticated users may select rows where `userId = auth.uid()`; writes go through Prisma (`puyer_prisma`).

Re-checked Context7 `/vercel/next.js/v16.2.9` (route handlers), `/prisma/web` (optional FKs), `/websites/resend` (`replyTo`) on 2026-08-29.

## How to use

1. Apply [`supabase/migrations/20260829200000_support_requests.sql`](../supabase/migrations/20260829200000_support_requests.sql). `npx prisma generate`.
2. Production: `RESEND_API_KEY`; verify `help@puyer.org` on the Resend domain. Set `HELP_INBOX` if the mailbox is not `support@puyer.org`.
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
- `help@puyer.org` must be a verified Resend domain or sends fail.

## Modules

- `app/help/page.tsx`, `components/help/help-screen.tsx`, `app/api/help/route.ts`
- `lib/help/**`, `lib/email/index.ts`, `lib/email/resend.ts`
- `prisma/schema.prisma`, `supabase/migrations/20260829200000_support_requests.sql`
- `messages/en.json` (`help`, `dashboard.nav.help`, `header.help`, `footer.help`)

## Version

1.0.0 — 2026-08-29

## Changelog

```
[2026-08-29] – Added: Help Center with searchable articles, contact form, SupportRequest table, and Resend inbox/ack mail.
```
