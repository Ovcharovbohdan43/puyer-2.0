# Account and workspace bans

## Purpose

Let Trust & Safety restrict a **user** or an entire **organization** (temporary or permanent), store the reason, send an official email, and block the app until the ban is lifted or expires.

## Description

`AccountBan` is a server-only table (RLS on, no `authenticated` policies). Prisma role `puyer_prisma` can read/write it.

| Field | Meaning |
|---|---|
| `targetType` | `USER` or `ORGANIZATION` |
| `kind` | `TEMPORARY` (needs `endsAt`) or `PERMANENT` (`endsAt` null) |
| `status` | `ACTIVE` or `LIFTED` |
| `reason` | Required, 12–2000 characters, stored and copied into the email |
| `startsAt` / `endsAt` / `liftedAt` / `notifiedAt` | Timestamps |

One active ban per user and per organization (partial unique indexes). Applying a new ban lifts the previous active row for that target.

Enforcement: `requireSession` and dashboard / onboarding / login layouts call `findActiveBanForUser`. A user ban or any membership in a banned workspace redirects to `/banned` and API writes return 403. Public invoice pages stay up so payers are not blocked.

Email: `sendBanNoticeEmail` uses the stored reason, temporary end date, Help Center, and `support@puyer.org` (or `HELP_INBOX`). If Resend is unset, the ban still saves and a warning is logged.

Ops API (not in the product UI): `Authorization: Bearer $PLATFORM_ADMIN_SECRET` (32+ characters).

- `GET /api/admin/bans?target=USER` or `?target=ORGANIZATION` — list accounts (email/name/workspace, up to 2000). Used by the ops script so you do not paste UUIDs.
- `GET /api/admin/bans?target=ACTIVE` — list bans currently in force (id + label). Used to lift without pasting a ban id.
- `POST /api/admin/bans` — apply (`action: ban`) or lift (`action: lift`, `banId`).

```json
{
  "action": "ban",
  "targetType": "USER",
  "userId": "<uuid>",
  "kind": "TEMPORARY",
  "endsAt": "2026-09-15T00:00:00.000Z",
  "reason": "Repeated Terms of Service violations involving invoice spam."
}
```

Lift: `{ "action": "lift", "banId": "<uuid>" }` (ban id from `target=ACTIVE` or from the apply response). Organization bans use `targetType: "ORGANIZATION"` and `organizationId`.

SQL: [`supabase/migrations/20260830140000_account_bans.sql`](../supabase/migrations/20260830140000_account_bans.sql).

## How to use

1. Apply the migration and `npx prisma generate`.
2. Set `PLATFORM_ADMIN_SECRET` and `EMAIL_FROM` / Resend so notices send.
3. GET the list or POST the JSON above. The recipient gets the official letter; they see `/banned` after sign-in.

## Examples

- Temporary user ban until 15 Sep → email includes the date; after that, `isBanInForce` is false without a lift.
- Organization ban → every member is emailed and blocked.
- Expired temporary row with `status=ACTIVE` does not block (end date in the past).

## How to test

```bash
npx prisma generate
npm run test
npm run typecheck
```

## Limitations

- No in-app admin screen. Apply bans with the API or SQL (SQL does not send mail unless you also call the app).
- Sessions are not revoked in GoTrue; APIs and app routes still refuse the user.
- Public `/invoice/{publicId}` remains available.

## Modules

- `prisma/schema.prisma`, `supabase/migrations/20260830140000_account_bans.sql`
- `lib/moderation/*`, `lib/email/index.ts`, `lib/authorization/index.ts`
- `app/api/admin/bans/route.ts`, `app/(marketing)/banned/page.tsx`

## Version

1.0.3 — 2026-08-30

## Changelog

```
[2026-08-30] – Added: GET /api/admin/bans?target=ACTIVE lists in-force bans for ops lift.
[2026-08-30] – Fixed: Ops account list typecheck (`isBanInForce` does not require `reason`).
[2026-08-30] – Added: GET /api/admin/bans?target=USER|ORGANIZATION for the ops account list.
[2026-08-30] – Added: User and organization bans (temporary/permanent) with stored reason, notice email, `/banned`, and admin API.
```
