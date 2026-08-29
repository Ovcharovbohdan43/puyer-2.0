# Authenticated dashboard

## Purpose

Signed-in app chrome: **Home** (`/dashboard`), **Invoices** (`/invoices`) with a right-hand preview drawer, **Clients**, Payments, Reports, Settings, Team, Billing, Notifications.

Sources: light forest-green product frames (Clients, Reports, Payment reminders). The app is **light-only**.

## Description

Light shell (`#F6F7F6` page, white cards, forest `#006C49`). Desktop sidebar is 260px (Home, Clients, Invoices, Payments, Reports; footer Settings, Team, Notifications). Mobile uses a bottom tab bar (Home, Clients, Invoices, Payments, More). More opens Reports, Settings, Team, Billing, Notifications.

Overview: greeting, search, Create Invoice, four KPI cards, revenue chart (Business), Quick Actions, Insights, Recent Invoices. Invoices: search, Filter, Export, three KPIs, paginated table. Clicking a row sets `?invoice=` to the invoice UUID and opens a 400px right drawer with Download / Share / Edit, a document preview card, and timeline.

Drawer Edit goes to `/invoices/:id/edit`. Drawer Share copies `/invoice/{publicId}`. `/invoices/new` is the authenticated builder.

There is **no** moon/sun control in the app. Visiting the dashboard forces `html[data-theme=light]`.

## How to use

```bash
npm run dev
```

Sign in (magic link), then open http://localhost:3000/dashboard

Unauthenticated visits to `/dashboard`, `/invoices`, `/clients`, `/payments`, `/reports`, `/settings`, `/team`, `/billing`, and `/notifications` redirect to `/login`.

## Examples

- Overview Create Invoice / sidebar New Invoice → `/invoices/new`
- Overview Add Client → modal, stay on Overview
- Overview Reminder → Pro: automatic schedule copy; Free: upgrade + `/billing`
- Overview Connect Stripe → `/settings`
- Overview View All or a recent row → `/invoices` or `/invoices?invoice=`
- Invoices Filter cycles All → Pending → Paid → Overdue
- Click an invoice row → right preview drawer; close clears `?invoice=`

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

- Sign in, confirm light sidebar + Overview KPIs and recent table
- Open `/invoices`, click a row, confirm white right drawer + `?invoice=` UUID, close, URL clears
- Mobile viewport: bottom tabs; More sheet lists Reports / Settings / Team / Billing / Notifications
- Sidebar icons stay readable when idle (not faint mixed-color SVGs)
- Signed-out `/invoices` and `/clients` redirect to `/login`
- Sign out is in the sidebar (desktop) and More sheet (mobile)
- Public `/invoice/[publicId]` (singular) is not gated by this shell

## Limitations

- Revenue Trends and Insights on Overview follow the Business reports gate (live data or upgrade copy + Billing link). Paid (30d) is last 30 days, not lifetime revenue.
- Payments lists synchronized Connect charges. Billing is live (Puyer subscription). Notifications inbox + preferences are live. Reports are live (base KPIs all plans; advanced Business). Team invites are live for Business.
- Desktop sidebar does not collapse to icons; mobile hides the rail.
- Sidebar and mobile tabs use Phosphor duotone icons (same family as marketing). KPI/action icons on Overview still use `public/app` SVGs.
- Mixed-currency KPI cards use the most common currency only.
- Credit notes and a product catalog are not in v1; those mock items are not routes.

## Modules

- `app/(dashboard)/*`, `components/dashboard/*`
- `lib/dashboard/*`, `lib/clients/list-view.ts`, `lib/auth/protected-routes.ts`, `proxy.ts`
- `messages/en.json` (`dashboard`)
- `public/app/*.svg`

## Version

1.2.2 — 2026-08-29

## Changelog

```
[2026-08-29] – Changed: Light forest-green dashboard; invoice list keeps a right preview drawer.
[2026-08-28] – Added: Dark app shell, Overview (Figma 22017:766), Invoices list + drawer, mock KPIs, protected extra routes.
[2026-08-28] – Changed: Overview, Invoices, and Clients read persisted invoices/clients. KPIs are live.
[2026-08-28] – Changed: Settings is Stripe Connect; Payments lists connected-account charges.
[2026-08-28] – Changed: Billing is live; Overview reminder and Team/Reports stubs use entitlement CTAs.
[2026-08-28] – Changed: Notifications inbox and preferences (Phase 6).
[2026-08-28] – Changed: Reports page + Overview trends/insights (Phase 7).
[2026-08-28] – Changed: Overview Paid (30d) and trends upgrade CTA; snapshot-backed completed months.
[2026-08-28] – Changed: Team page is live (invites, roles, workspace switch).
[2026-08-28] – Changed: Signed-out app routes redirect to `/login`.
[2026-08-28] – Fixed: Settings survives a failed Stripe/workspace lookup. Sign out is in the sidebar and More sheet.
[2026-08-29] – Changed: Overview moon no longer restyles the landing (marketing stays light).
[2026-08-29] – Changed: Sidebar uses the Puyer lockup instead of text.
[2026-08-29] – Changed: Sidebar and mobile nav use Phosphor icons (House, Users, Receipt, card, chart, gear, bell).
[2026-08-29] – Fixed: Dashboard and cookie icons load via Phosphor `dist/csr` in client components.
```
