# Reminders, email, notifications (Phase 6)

## Purpose

Email clients about unpaid invoices on a schedule, and show workspace members an in-app inbox. Reminders are a **Pro/Business** entitlement. **Automatic** sends never run from a browser click alone — Inngest cron is the source of truth. **Manual** sends from the invoice drawer are a signed-in API call (same idea as invoice Send).

## Description

- Default rule per organization: 3 days before due, on the due date, 3 days after. Disabled invoices: **PAID**, **CANCELED**, **DRAFT**.
- Idempotency: unique `(invoiceId, type, scheduledDate)` plus Resend `idempotencyKey` `reminder:{invoiceId}:{type}:{YYYY-MM-DD}`.
- Cron (`*/15 * * * *`) finds due work, then fans out `puyer/reminder.send`. Send is skipped if the client has no valid email or Resend is not configured.
- Invoice drawer **Send reminder** (Pro/Business): editable body, one MANUAL send per invoice per UTC day, from `Puyer Reminders <reminders@puyer.org>` (`EMAIL_FROM_REMINDERS` override). HTML is escaped.
- Invoice drawer **Set status** follows `STATUS_TRANSITIONS` (not OVERDUE overlay). Stripe Connect remains the source of truth for card payments; PAID can still be set for bank-transfer cases.
- Invoice **Send** emails the client immediately (user-initiated, not a reminder). Payment success writes an in-app notification when invoice status actually changes.
- `/notifications` lists the inbox and email / in-app preference toggles. In-app off skips creating rows for that member. Client reminder emails still go to the client.

Inngest SDK 4: `serve` exports `GET`/`POST`/`PUT` only. Functions use `cron()` and `eventType()` triggers. Re-checked Context7 `/websites/inngest`, `/inngest/inngest-js`, `/websites/resend`, `/vercel/next.js/v16.2.9` on 2026-08-28.

## How to use

1. Apply [`supabase/migrations/20260828230000_reminders_notifications.sql`](../supabase/migrations/20260828230000_reminders_notifications.sql) and [`supabase/migrations/20260829170000_manual_reminders.sql`](../supabase/migrations/20260829170000_manual_reminders.sql). `npx prisma generate`.
2. `.env.local`: `RESEND_API_KEY`, `EMAIL_FROM` (verified domain), `EMAIL_FROM_REMINDERS=Puyer Reminders <reminders@puyer.org>`. Auth magic links use dashboard HTML templates over Resend SMTP unless the Send Email hook is enabled (see [`auth.md`](./auth.md)). Optional: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`.
3. Local: `INNGEST_DEV=1` in `.env.local` and/or `npx inngest-cli@latest dev` (syncs `/api/inngest`). Production: Inngest Cloud app pointing at `https://<host>/api/inngest` with `INNGEST_SIGNING_KEY`.
4. Workspace must be Pro/Business. Client needs a valid email.

## Examples

- SENT invoice due 10 Sep, now 7 Sep UTC → `BEFORE_DUE` only.
- Same invoice on 10 Sep → `ON_DUE`. On 13 Sep → `AFTER_DUE`.
- PAID on the due date → no send; unique skip row if a claim already existed, otherwise no event.

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Without Resend keys, due reminders are claimed then **SKIPPED** (logged). Overview Reminder on Pro explains the schedule; Free still links to `/billing`.

## Limitations

- Reminder offsets are org defaults only (no per-invoice schedule UI yet). Manual send is once per invoice per UTC day.
- `reminders@puyer.org` must be a verified Resend domain or sends fail.
- Owner “email me” is stored; client reminders are independent of that toggle.
- Inngest enqueue of Stripe webhooks remains Phase 6-adjacent and is still inline (reminders are the job runner).
- No `/api/cron` fallback in this increment.

## Modules

- `lib/reminders/**`, `lib/email/**`, `lib/notifications/**`, `lib/jobs/**`
- `app/api/inngest/route.ts`, `app/api/notifications/**`, `app/api/invoices/[id]/remind/route.ts`, `app/api/invoices/[id]/status/route.ts`
- `app/(dashboard)/notifications/page.tsx`, `components/dashboard/notifications-screen.tsx`
- `prisma/schema.prisma`, `supabase/migrations/20260828230000_reminders_notifications.sql`

## Version

1.0.3 — 2026-08-29

## Changelog

```
[2026-08-29] – Added: Invoice drawer manual reminder (editable body, reminders@puyer.org) and allowed status changes; MANUAL ReminderType.
[2026-08-28] – Added: Inngest reminder cron, Resend client/invoice email, in-app notifications and preferences.
[2026-08-28] – Changed: Invoice, reminder, and invite emails use the branded Puyer layout.
[2026-08-28] – Changed: Shared Resend HTML layout uses a full 600px table document (DOCTYPE, charset, MSO, bgcolor).
```
