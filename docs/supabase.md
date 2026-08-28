# Supabase clients

**Version / updated:** 2026-08-28

## Purpose

Wire the Next.js 16 App Router to the Puyer Supabase project using `@supabase/ssr` so browser, server, and proxy code share one cookie-based session.

## Description

Auth in Puyer is **email magic link only** (`signInWithOtp`). Browser/server/proxy clients live in `utils/supabase/*`. Login UI and OTP API: [`docs/auth.md`](./auth.md).

| File | Role |
|---|---|
| `utils/supabase/env.ts` | Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `utils/supabase/client.ts` | Browser client (`createBrowserClient`) |
| `utils/supabase/server.ts` | Server Component / Route Handler client (`createServerClient` + `cookies()`) |
| `utils/supabase/middleware.ts` | Cookie adapter + `auth.getClaims()` session refresh |
| `proxy.ts` | Next.js 16 entry (replaces deprecated `middleware.ts`) |
| `supabase/config.toml` | Local CLI config (site URL + callback allow-list) |

The dashboard “todos” `page.tsx` snippet is **not** applied. The marketing homepage stays the landing page.

Session refresh does **not** redirect anonymous visitors on marketing routes (`/`, `/pricing`). Protected app routes (`/dashboard`, `/invoices`) redirect to `/?login=1`. See [`docs/auth.md`](./auth.md).

## How to connect (cloud project)

1. Public keys belong in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
2. In the [Supabase dashboard](https://supabase.com/dashboard) → **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
3. Prisma URLs — green **Connect** button at the top of the project (not Settings → Database):
   - TypeScript / ORMs → copy **Transaction pooler** (`:6543`) into `DATABASE_URL`, add `?pgbouncer=true`
   - copy **Session pooler** (`:5432`) into `DIRECT_URL` (Windows is IPv4; do not use `db.*.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` is optional for magic link. If you want it: **Project Settings → API Keys** → Secret keys (`sb_secret_...`) or Legacy `service_role`. Never `NEXT_PUBLIC_`.
4. Apply schema in the SQL Editor: run [`supabase/migrations/20260828120000_identity_rls_and_trigger.sql`](../supabase/migrations/20260828120000_identity_rls_and_trigger.sql), then [`supabase/migrations/20260828180000_invoice_domain.sql`](../supabase/migrations/20260828180000_invoice_domain.sql).
   If you later add Prisma URLs: `npx prisma migrate resolve --applied 20260828120000_identity`.
5. Restart `npm run dev`.

Do not commit `.env.local`.

## How to use

Server:

```ts
import { createClient } from "@/utils/supabase/server";

const supabase = await createClient();
const { data } = await supabase.auth.getClaims();
```

Browser (Client Components only):

```ts
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
```

## How to test

```bash
npm test -- utils/supabase/env.test.ts
npm run typecheck
```

Manual: `npm run dev`, open `/` and `/pricing`. Both must load without a login redirect.

## Limitations

- Publishable key is public by design (RLS). Never put `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*` or client code.
- `setAll` in Server Components can throw; cookie writes after refresh happen in `proxy.ts`.
- Magic link works with public keys only. `/dashboard` needs Prisma + identity tables (`DATABASE_URL`).
- Missing public env: `trySupabasePublicEnv()` returns null so `/` still loads.

## Modules touched

`utils/supabase/*`, `proxy.ts`, `supabase/config.toml`, `.env.example`, `package.json`, this doc.

## Changelog

- [2026-08-28] – Added: `@supabase/ssr` browser/server clients and Next.js 16 `proxy.ts` session refresh.
- [2026-08-28] – Changed: `trySupabasePublicEnv()` so marketing works without keys; `/dashboard` and `/invoices` require a session.
- [2026-08-28] – Added: `supabase init` (`config.toml`), pinned CLI, cloud Auth health check; documented remaining DB URLs.
- [2026-08-28] – Added: `.env.local` Prisma URLs via MCP (dedicated `puyer_prisma` role, direct 5432).
- [2026-08-28] – Added: Invoice domain tables + RLS (`20260828180000_invoice_domain.sql`).
- [2026-08-28] – Added: Private `invoice-pdfs` Storage bucket (`20260828190000_invoice_pdf_storage.sql`).
