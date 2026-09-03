# Page load performance

**Version / updated:** 2026-09-03

## Purpose

Keep every route fast. Anonymous marketing must not wait on Auth. Signed-in app routes must not repeat the same JWT and Prisma work on one request, and client navigations should reuse the App Router cache.

## Description

Slow loads were not a CSS problem. Each HTML/RSC request did this:

1. **`proxy.ts` called `auth.getClaims()` for every path** (home, pricing, help, webhooks, dashboard). That waits on JWKS even when there is no session cookie.
2. **Dashboard layout then page each called `getClaims()` again**, then bans, then workspace provision — sequential round-trips to Auth and Postgres.
3. **Ban checks used three queries** (user bans, memberships, then org bans). Workspace load used two or three membership queries.
4. **The async dashboard layout blocked the shell** before children could stream.
5. **Next.js client cache `staleTimes.dynamic` defaulted to 0**, so every in-app `Link` refetch hit the server.

What we use (Next.js 16.2 / React 19, Context7 `/vercel/next.js` v16.2.9):

| Technique | Where |
|---|---|
| Optimistic session gate (cookie presence, no JWKS) | `lib/auth/session-refresh.ts` + `proxy.ts` |
| `React.cache()` request memoization | `getSessionOrNull`, `requireSession`, `findActiveBanForUser`, `ensureWorkspace` |
| Parallel `Promise.all` after session | Dashboard layout: ban + workspace |
| Layout `Suspense` streaming | `app/(dashboard)/layout.tsx` |
| `experimental.staleTimes` | `next.config.ts` — 30s dynamic / 180s static client cache |
| Fewer Prisma round-trips | Membership in one `findMany`; bans in two parallel queries |

`cacheComponents` (Partial Prerendering) is **not** enabled yet: Auth pages read `cookies()` at the page/layout root, and turning the flag on without wrapping every cookie read in a Suspense island fails the production prerender. Revisit after those islands exist.

## How to use

Anonymous `/`, `/pricing`, `/help`, `/login`, and Stripe webhooks skip `getClaims()` in the proxy.

Protected routes with **no** `sb-*` cookies redirect to `/login` immediately.

Any request that already has Supabase cookies still refreshes via `updateSession` so Server Components can keep using `getClaims()` (cookie `setAll` only works reliably in `proxy.ts`).

## Examples

- Logged-out visit to `/` → proxy `next()`, static RSC, no Auth network.
- Logged-out visit to `/dashboard` → redirect to `/login` without JWKS.
- Logged-in visit to `/invoices` → one proxy `getClaims()`, one RSC `getClaims()`, workspace + ban shared for layout and page, shell streams behind `PuyerRouteLoading`.
- Clicking Home → Invoices within 30s → client cache, no full refetch.

## How to test

```bash
npm test -- lib/auth/session-refresh.test.ts
npm run typecheck
```

Manual: `npm run dev`, open `/` (should not wait on Supabase Auth). Sign in, move between `/dashboard` and `/invoices` (second click within 30s should feel instant).

## Limitations

- Public invoice GET still rate-limits (Upstash when configured).
- `staleTimes.dynamic: 30` can show invoice/client lists up to 30 seconds stale on client navigations; a full refresh always loads live data.
- `React.cache()` is per-request only. It does not replace Redis.
- Enabling `cacheComponents: true` later still requires Suspense around every `cookies()` / `headers()` / `searchParams` read.

## Modules

- `proxy.ts`, `next.config.ts`, `app/(dashboard)/layout.tsx`
- `lib/auth/session-refresh.ts`, `lib/authorization/index.ts`, `lib/identity/provision.ts`, `lib/moderation/bans.ts`
- `docs/auth.md`, `docs/supabase.md`, `docs/dashboard.md`, `PLAN.md`

## Changelog

```
[2026-09-03] – Added: Proxy skips Auth JWKS for anonymous traffic; request-memoized session/bans; streaming dashboard shell; App Router staleTimes.
```
