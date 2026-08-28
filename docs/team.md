# Teams (Phase 8)

## Purpose

Business workspaces can invite members. Owners manage seats, billing, and Stripe. Members work on invoices and clients. Roles come from the database, never from the request body.

## Description

- Entitlement: `TEAM_MEMBERS` (Business). Free/Pro see `/team` with an upgrade CTA.
- Invite: owner POSTs an email. Server stores `sha256(token)` on `OrganizationInvite`, emails `/invite/{token}` via Resend. TTL **7 days**. Role on invite is always **MEMBER**.
- Accept: signed-in email must match the invite (case-insensitive). Creates `OrganizationMember` + `NotificationPreference`, sets `User.activeOrganizationId`.
- Permission matrix (`lib/authorization/permissions.ts`): MEMBER cannot `MANAGE_BILLING`, `MANAGE_STRIPE`, or `MANAGE_MEMBERS`. Last remaining OWNER cannot be demoted or removed.
- Audit: `MEMBER_INVITED`, `ROLE_CHANGED`.
- Magic-link `returnTo` may be `/invite/{64-hex}` only (open redirects still rejected).

Re-checked Context7 `/vercel/next.js/v16.2.9` (cookies) and `/prisma/web` (compound unique) on 2026-08-28.

## How to use

1. Apply [`supabase/migrations/20260828250000_team_invites.sql`](../supabase/migrations/20260828250000_team_invites.sql). `npx prisma generate`.
2. Workspace must be Business. Owner opens `/team`, enters an email, sends invite.
3. Invitee opens the link → magic link if needed → **Join workspace**.

## Examples

- MEMBER calling `POST /api/team/invite` → 403.
- Free OWNER invite → 403 entitlement.
- Last OWNER demoted to MEMBER → 403.
- Invite token for `ada@x.com` accepted while signed in as `bob@x.com` → 403.

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Without `RESEND_API_KEY`, the invite row is still created and the email is skipped (logged).

## Limitations

- Accepting an invite does not delete the invitee’s personal OWNER workspace created at signup; `activeOrganizationId` switches to the Business org. Switcher on `/team` if they have more than one membership.
- No seat cap.
- Invite emails are not localized.

## Modules

- `lib/authorization/permissions.ts`, `lib/team/**`
- `app/api/team/**`, `app/invite/[token]/page.tsx`
- `app/(dashboard)/team/page.tsx`, `components/dashboard/team-screen.tsx`
- `prisma/schema.prisma`, `supabase/migrations/20260828250000_team_invites.sql`

## Version

1.0.0 — 2026-08-28

## Changelog

```
[2026-08-28] – Added: Team invites, role/remove, permission matrix, invite accept URL, active workspace switch.
```
