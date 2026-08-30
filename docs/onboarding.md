# Workspace onboarding

## Purpose

After the first magic-link sign-in, owners set how invoices are branded. Existing accounts skip this.

## Description

There was no product onboarding: `ensureWorkspace` created a workspace from the email local part and sent people to Home. `/onboarding` now runs until `User.onboardingCompletedAt` is set.

- Owners: three steps — you (name required, timezone optional), business (name required, address optional), invoice defaults (currency required, tax and first client optional).
- Members: name (required) and timezone (optional) only.
- App shell routes redirect here while the timestamp is null. Signed-in visits to `/pricing` do the same, then return to pricing.
- Existing rows are backfilled in [`supabase/migrations/20260830090000_user_onboarding.sql`](../supabase/migrations/20260830090000_user_onboarding.sql) so current users are not interrupted.
- Step changes use the View Transitions API with `flushSync` when the browser supports it. Optional fields use the Popover API. Address uses `field-sizing: content`. Reduced motion turns transitions off.

Re-checked Context7 `/vercel/next.js/v16.2.9` (`redirect` in Server Components, route groups) and `/prisma/web` (optional `DateTime`) on 2026-08-30.

## How to use

1. Apply the SQL migration, then `npx prisma generate`.
2. Sign in as a new user → `/onboarding` → **Go to Puyer**.

## Examples

- New owner with only name + business name → 200 from `POST /api/onboarding`, Home opens with that business on new invoices.
- Owner leaves client fields empty → no `Client` row.
- Member submits name → timestamp set; business profile unchanged.
- Guest `/onboarding` → `/login`.

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Playwright `e2e/pay-path.spec.ts` expects `/onboarding` to redirect to `/login` when signed out.

## Limitations

- Logo upload is not in this wizard (still Settings later).
- Stripe Connect stays on Settings after a plan upgrade.
- Timezone list is a short IANA set plus the device zone.
- Completing onboarding does not send email.

## Modules

- `app/(onboarding)/onboarding/page.tsx`, `components/onboarding/onboarding-screen.tsx`, `app/api/onboarding/route.ts`
- `lib/onboarding/**`, `app/(dashboard)/layout.tsx`, `app/(marketing)/pricing/page.tsx`
- `prisma/schema.prisma`, `supabase/migrations/20260830090000_user_onboarding.sql`
- `messages/en.json` (`onboarding`)

## Version

1.0.1 — 2026-08-30

## Changelog

```
[2026-08-30] – Fixed: Timezone select and Use this device sit on one aligned row.
[2026-08-30] – Added: Stepped workspace onboarding after first sign-in.
```
