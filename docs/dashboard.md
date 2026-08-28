# Authenticated dashboard

## Purpose

Signed-in app chrome: **Overview** (`/dashboard`), **Invoices** (`/invoices`) with a row detail drawer, and **Clients**. KPI numbers and invoice rows come from saved invoices. See [`invoices.md`](./invoices.md).

Sources:

- Overview main content: [Figma node 22017:766](https://www.figma.com/design/gceJUMGMfVPHmmVOqAeEVx/Photo-portfolio--Copy-?node-id=22017-766)
- Invoices + drawer + sidebar: design CSS dump + screenshot of the Invoices frame (Figma MCP sidebar node was rate-limited)

## Description

Dark-first shell (`#0B1320` page, `#131B2E` panels, mint `#6FFBBE`). Desktop sidebar is 280px (Overview, Invoices, Clients, Payments, Reports, Settings, New Invoice). Mobile uses a bottom tab bar (Overview, Invoices, Clients, Payments, More). More opens Reports, Settings, Team, Billing, Notifications.

Overview matches Figma 22017:766: greeting, search, theme toggle, Create Invoice, four KPI cards, Revenue Trends placeholder, Quick Actions, Insights, Recent Invoices. Invoices matches the pasted frame: search, Filter, three KPIs, table, 400px right drawer with Download / Share / Edit, skeleton preview, timeline.

Clicking an invoice row sets `?invoice=` to the invoice UUID (see [`UX_FLOWS.md`](./UX_FLOWS.md)). Drawer Edit goes to `/invoices/:id/edit`. Drawer Share copies `/invoice/{publicId}`. `/invoices/new` is the authenticated builder.

Icons are Figma-exported SVGs in `public/app/` (overview MCP assets) plus existing `public/landing/` glyphs reused where the glyph matches (document, download, share). No generated icon set.

## How to use

```bash
npm run dev
```

Sign in (magic link), then open http://localhost:3000/dashboard

Unauthenticated visits to `/dashboard`, `/invoices`, `/clients`, `/payments`, `/reports`, `/settings`, `/team`, `/billing`, and `/notifications` redirect to `/?login=1`.

## Examples

- Overview Create Invoice / sidebar New Invoice → `/invoices/new`
- Overview Add Client → modal, stay on Overview
- Overview Reminder → Pro: automatic schedule copy; Free: upgrade + `/billing`
- Overview Connect Stripe → `/settings`
- Overview View All or a recent row → `/invoices` or `/invoices?invoice=`
- Invoices Filter cycles All → Pending → Paid → Overdue
- Drawer close clears `?invoice=`

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

- Sign in, confirm sidebar + Overview KPIs and recent table
- Open `/invoices`, click a row, confirm drawer + `?invoice=` UUID, close, URL clears
- Mobile viewport: bottom tabs; More sheet lists Reports / Settings / Team / Billing / Notifications
- Signed-out `/invoices` and `/clients` redirect to `/?login=1`
- Public `/invoice/[publicId]` (singular) is not gated by this shell

## Limitations

- Revenue Trends and Insights on Overview follow the Business reports gate (live data or upgrade copy + Billing link). Paid (30d) is last 30 days, not lifetime revenue.
- Payments lists synchronized Connect charges. Billing is live (Puyer subscription). Notifications inbox + preferences are live. Reports are live (base KPIs all plans; advanced Business). Team invites are live for Business.
- Desktop sidebar is a fixed 280px rail (Figma). Collapse-to-icons is not in this frame; mobile hides the rail.
- Sidebar node `22017:934` was not downloaded from Figma MCP (Starter plan limit). Nav icons reuse overview/landing exports.
- Dashboard chrome stays dark even when the public theme toggle is light (PLAN: dark-first app). The Overview moon control still toggles `html[data-theme]` for marketing pages.
- Mixed-currency KPI cards use the most common currency only.

## Modules

- `app/(dashboard)/*`, `components/dashboard/*`
- `lib/dashboard/*`, `lib/auth/protected-routes.ts`, `proxy.ts`
- `messages/en.json` (`dashboard`)
- `public/app/*.svg`

## Version

1.1.6 — 2026-08-28

## Changelog

```
[2026-08-28] – Added: Dark app shell, Overview (Figma 22017:766), Invoices list + drawer, mock KPIs, protected extra routes.
[2026-08-28] – Changed: Overview, Invoices, and Clients read persisted invoices/clients. KPIs are live.
[2026-08-28] – Changed: Settings is Stripe Connect; Payments lists connected-account charges.
[2026-08-28] – Changed: Billing is live; Overview reminder and Team/Reports stubs use entitlement CTAs.
[2026-08-28] – Changed: Notifications inbox and preferences (Phase 6).
[2026-08-28] – Changed: Reports page + Overview trends/insights (Phase 7).
[2026-08-28] – Changed: Overview Paid (30d) and trends upgrade CTA; snapshot-backed completed months.
[2026-08-28] – Changed: Team page is live (invites, roles, workspace switch).
```
