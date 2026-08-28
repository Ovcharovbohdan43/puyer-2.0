# Auth (Phase 1)

## Purpose

Email magic-link sign-in for Puyer. Supabase Auth owns the session. `public.User` is the app profile (`id` = `auth.users.id`). Each new user gets an Organization (OWNER), BusinessProfile, and NotificationPreference.

## Description

- Public login is `/login`: split layout, email magic link (Sign in / Create account). The right panel is `public/auth/login-hero.png`. Download/Share on the landing builder still use a modal.
- Sign out is in the app sidebar, mobile More sheet, Settings, and the dashboard error boundary. It `POST`s `/api/auth/signout` so `@supabase/ssr` can clear httpOnly cookies, then sends the browser to `/login`.
- `POST /api/auth/otp` calls `signInWithOtp({ email })` only. No passwords. Hosted Auth sends the Magic Link template over Resend SMTP (`supabase/templates/magic_link.html`). The optional Send Email hook is an alternative, not a second path.
- Rate limit: 5 sends / 15 minutes / email (in-process; Upstash in Phase 9).
- `GET /auth/callback` exchanges the PKCE `code` and redirects using `puyer-auth-return`.
- Public Supabase helpers live in `utils/supabase/*`. `lib/auth/browser.ts` and `lib/auth/server.ts` wrap them so marketing still loads when keys are missing (`trySupabasePublicEnv()`).
- Next.js 16 request gate is [`proxy.ts`](../proxy.ts) (`getClaims()` before the response is committed). `/dashboard`, `/invoices`, `/clients`, `/payments`, `/reports`, `/settings`, `/team`, `/billing`, and `/notifications` require a session; otherwise redirect to `/login`. `/?login=1` also redirects to `/login`.
- Prisma uses the server connection **and** `requireSession` / `requireOrganization` / `requireOrgRole`. RLS in [`supabase/migrations/20260828120000_identity_rls_and_trigger.sql`](../supabase/migrations/20260828120000_identity_rls_and_trigger.sql) is defense in depth.
- `requireOrganization` is idempotent: if the session is valid and `OrganizationMember` is missing, `ensureWorkspace` creates `User` + Organization (OWNER) + BusinessProfile + NotificationPreference. That covers Auth users created before `on_auth_user_created` existed. The call is memoized with React `cache()` so layout and page do not provision twice in one request; a unique-constraint race retries by re-reading membership. Cross-tenant lookups still 404 via `resolveTenantRecord`.
- Authenticated Create Invoice goes to `/invoices/new` and saves through the invoice domain. Dashboard UI is the Figma app shell; see [`dashboard.md`](./dashboard.md) and [`invoices.md`](./invoices.md).

## How to use

1. Public keys in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
2. Dashboard → Authentication → URL Configuration: Site URL `http://localhost:3000`, Redirect `http://localhost:3000/auth/callback`.
3. **Auth emails via Resend SMTP (recommended for hosted Auth):**
   - Connect Resend as custom SMTP in the Supabase dashboard. Do **not** enable the Send Email hook at the same time or users can get two emails.
   - Open **Authentication → Email Templates → Magic Link** (not Confirm signup). Subject: `Sign in to Puyer`.
   - Paste the **entire** file `supabase/templates/magic_link.html` into the Body field (source/HTML, not a visual editor). Save. The file is a full HTML document (`DOCTYPE`, `html`/`head`/`body`, 600px tables, inline CSS). Supabase fills `{{ .ConfirmationURL }}` and `{{ .Token }}` before sending to Resend.
   - Repeat for Confirm signup (`confirmation.html`), Invite (`invite.html`), Reset password (`recovery.html`), Change email (`email_change.html`).
   - In Resend: disable **Click tracking** so Auth links are not rewritten. Do not create a Resend Dashboard template for magic links — SMTP sends the HTML Supabase already rendered. Resend `{{{VAR}}}` syntax will not be substituted.
4. **Optional Send Email hook** (only if SMTP templates are unused): `.env.local` / Vercel `RESEND_API_KEY`, `EMAIL_FROM`, `SEND_EMAIL_HOOK_SECRET`. Dashboard → **Authentication → Hooks → Send Email** → `https://<your-app>/api/auth/send-email`. Hosted Auth cannot reach `localhost`.
5. Prisma (only needed after login, for `/dashboard`): green **Connect** at the top of the project.
   Copy Transaction pooler (`:6543` + `?pgbouncer=true`) → `DATABASE_URL`, Session pooler (`:5432`) → `DIRECT_URL`.
6. SQL Editor: run identity SQL, then [`supabase/migrations/20260828180000_invoice_domain.sql`](../supabase/migrations/20260828180000_invoice_domain.sql), then [`supabase/migrations/20260828200000_backfill_identity_workspaces.sql`](../supabase/migrations/20260828200000_backfill_identity_workspaces.sql) if any Auth user predates the trigger.
7. `npm run dev` → open `/login` (or header Login) → email → open the magic link.

## Examples

- Login intent → after the link, `/dashboard`.
- Subscribe intent (`/login?intent=subscribe`) → after the link, `/pricing`.
- Download/Share intent → landing modal, then after the link `/?resume=download` or `/?resume=share` (user clicks Download/Share again; unauth drafts are not persisted).

## How to test

```bash
npx prisma generate
npm run test
npm run typecheck
npm run lint
```

Without live keys, OTP returns a safe “not configured” or send-failure message. Unit tests cover OTP throttling, return-path sanitization, login URLs, and org role checks. Open `/login` to confirm the split form + hero.

## Limitations

- No live OTP without `.env.local`.
- In-process rate limit does not share across serverless instances.
- Overview and Invoices read live invoice data (Phase 2). A signed-in user without a workspace is provisioned on first `requireOrganization`, not shown as 404.
- Service role is not used by the browser. Do not expose `SUPABASE_SERVICE_ROLE_KEY`.
- Hosted Auth email HTML is not loaded from the git repo. After changing `supabase/templates/`, paste the file into the matching dashboard template and Save.
- Resend click tracking rewrites `{{ .ConfirmationURL }}` and can consume the magic link. Keep it off for Auth mail.
- A React overlay on `/dashboard` after the magic link was a theme bootstrap `<script>` in the root layout, not a failed session exchange. See [`theme.md`](./theme.md).

## Modules

- `prisma/schema.prisma`, `lib/db/prisma.ts`
- `utils/supabase/*`, `lib/auth/*`, `lib/authorization/*`, `lib/identity/*`, `lib/errors`, `lib/observability`, `lib/audit`
- `proxy.ts`, `app/api/auth/otp/route.ts`, `app/(auth)/auth/callback/route.ts`, `app/(auth)/login/page.tsx`, `app/api/auth/send-email/route.ts`, `app/api/auth/signout/route.ts`
- `lib/email/auth-templates.ts`, `lib/email/layout.ts`, `lib/email/send-email-hook.ts`, `lib/auth/login-path.ts`, `supabase/templates/*`
- `components/auth/*`
- `app/(dashboard)/*`, `components/dashboard/*`
- `components/invoice-builder/builder-session.tsx`

## Version

1.0.10 — 2026-08-28

## Changelog

```
[2026-08-28] – Added: Magic-link auth, identity schema, proxy session refresh,
  OTP API, callback, minimal /dashboard.
[2026-08-28] – Changed: Cloud project public keys verified; CLI `config.toml` added.
[2026-08-28] – Fixed: SQL Editor bootstrap now creates identity tables before the auth trigger.
[2026-08-28] – Changed: Auth app chrome is the Figma dashboard; extra shell routes are session-gated.
[2026-08-28] – Fixed: Post-login React overlay was the theme bootstrap script, not auth.
[2026-08-28] – Changed: `/invoices/new` is the authenticated persisting builder (Phase 2).
[2026-08-28] – Fixed: Signed-in users without `OrganizationMember` (Auth created before the trigger) get an idempotent workspace instead of a 404 on `/invoices`.
[2026-08-28] – Fixed: Concurrent layout + page provision no longer fails on `User.email` unique.
[2026-08-28] – Changed: Subscribe intent returns to `/pricing` after magic link.
[2026-08-28] – Changed: Magic-link `returnTo` may be `/invite/{token}` for team invites (Phase 8).
[2026-08-28] – Changed: OTP limited by email and IP; optional Upstash; Origin check on POST.
[2026-08-28] – Added: Resend Send Email hook (`SEND_EMAIL_HOOK_SECRET`) and branded Auth templates.
[2026-08-28] – Changed: Auth HTML templates are full Resend-ready documents (600px tables, MSO, inline CSS) for Magic Link and sibling templates.
[2026-08-28] – Added: Split `/login` page (Sign in / Create account + vector hero). Gated routes redirect there.
[2026-08-28] – Changed: `/login` hero is `public/auth/login-hero.png` (invoice + card illustration).
[2026-08-28] – Fixed: Settings no longer 500s when Connect/workspace lookup fails. Sign out is in the app shell via `POST /api/auth/signout`.
```
