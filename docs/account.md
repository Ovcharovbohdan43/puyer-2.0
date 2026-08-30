# Account settings

## Purpose

Give signed-in users a full **Settings** page: profile, sign-in email, optional password, Stripe payments, links to billing/team/notifications, and an **account deletion request**.

## Description

`/settings` is no longer Stripe-only. The page has:

1. **Profile** — name, timezone; owners also edit business name, address, and **business country** (Stripe identity country; invoice currency can stay USD).
2. **Sign-in email** — `supabase.auth.updateUser({ email })`. Auth sends a confirmation to the **new** address (`email_change` template → `/auth/confirm?token_hash=&type=email_change`). Puyer also emails the **current** address that a change was requested. `public.User.email` syncs from `auth.users` after confirm (`sync_user_email_from_auth`).
3. **Optional password** — 12–128 characters, letter + number. Stored by Supabase Auth. After a successful change, Puyer emails this address. Login still offers a magic link first; **Sign in with password** posts to `POST /api/auth/password` (`signInWithPassword`).
4. **Payment settings** — existing Connect Stripe block, with a country picker. Invoice currency is not used to guess the United States.
5. **More** — Billing, Notifications, Team, Help.
6. **Delete account** — a **request**, not instant delete. Reason 12–2000 characters. Emails go to the user and `HELP_INBOX`. Status `OPEN` until canceled or later processed. One open request per user.

Rate limits: `account-write`, `account-email`, `account-password`, `password-login`. Origin check on all POSTs.

SQL: [`supabase/migrations/20260830160000_account_settings.sql`](../supabase/migrations/20260830160000_account_settings.sql) and [`20260830180000_business_country.sql`](../supabase/migrations/20260830180000_business_country.sql).

## How to use

1. Apply the migration and `npx prisma generate`.
2. Sign in → **Settings**.
3. Email change: enter the new address → confirm from that inbox → return to `/settings`.
4. Password: set it here, then on `/login` use **Sign in with password**.
5. Deletion: write a reason → **Request deletion** (or cancel while `OPEN`).

Push the `email_change` template with `npm run auth:push-templates` so hosted Auth uses `/auth/confirm` + `TokenHash`.

## Examples

- Owner changes business name → new invoices pick it up from BusinessProfile.
- Email already on another `User` → 400, no Auth update.
- Second deletion request while one is `OPEN` → 400.

## How to test

```bash
npx prisma generate
npm run test
npm run typecheck
npm run lint
```

Browser:

- `/settings` shows profile, email, password, Stripe, danger zone.
- Owner can set business country (for example Ukraine) while invoices stay USD.
- Save profile updates the sidebar name after refresh.
- Email change without confirming leaves the current address.
- Password login fails with a short password.
- Deletion request shows the pending copy; cancel clears it.

## Limitations

- A connected Stripe account’s country cannot be edited in Stripe. Disconnect, choose another country, then Connect to create a new connected account.
- Puyer does **not** auto-delete Auth users, invoices, or Stripe accounts when a request is opened. Ops complete that later.
- `currentPassword` is sent when the user fills it; first-time set can leave it blank.
- Magic link remains the default sign-in. Register is still email-link only.
- Hosted `email_change` HTML is not applied until `auth:push-templates`.
- Password-change and email-change-request notices need `RESEND_API_KEY` + `EMAIL_FROM` (same as other Puyer mail). Auth confirmation of the new inbox is still GoTrue.

## Modules

- `app/(dashboard)/settings/page.tsx`, `components/dashboard/account-settings-screen.tsx`
- `app/api/account/profile/route.ts`, `email/route.ts`, `password/route.ts`, `deletion/route.ts`
- `app/api/auth/password/route.ts`, `components/auth/magic-link-form.tsx`
- `lib/account/*`, `lib/email/index.ts`, `lib/regions/countries.ts`, `prisma/schema.prisma`
- `supabase/migrations/20260830160000_account_settings.sql`, `supabase/migrations/20260830180000_business_country.sql`, `supabase/templates/email_change.html`

## Version

1.0.2 — 2026-08-30

## Changelog

```
[2026-08-30] – Added: Business / Stripe country in Settings (independent of invoice currency).
[2026-08-30] – Added: Notice to the current inbox when email change is requested; notice after password change.
[2026-08-30] – Added: Account settings (profile, email change, optional password, deletion request).
```
