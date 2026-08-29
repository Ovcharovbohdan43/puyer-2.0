# Authenticated dashboard

## Purpose

Signed-in app chrome: **Home** (`/dashboard`), **Invoices** (`/invoices`) with a right-hand preview drawer, **Clients** (`/clients`) with a right-hand client drawer, Payments, Reports, Settings, Team, Billing, Notifications.

Sources: light forest-green product frames (Clients, Reports, Payment reminders). The app is **light-only**.

## Description

Light shell (`#F6F7F6` page, white cards, forest `#006C49`). Desktop sidebar is 260px (Home, Clients, Invoices, Payments, Reports; footer Settings, Team, Notifications). Mobile uses a bottom tab bar (Home, Clients, Invoices, Payments, More). More opens Reports, Settings, Team, Billing, Notifications.

Overview: greeting, search, Create Invoice, four KPI cards (Phosphor icons + fade-only sparklines, no stroke), a full-bleed Revenue Trends SVG (smooth path, vertical forest→mint gradient, `preserveAspectRatio="none"`), Quick Actions, Insights (Business), Recent Invoices. Invoices: search, Filter, Export, three KPIs with Phosphor icons, paginated table. Clicking a row sets `?invoice=` to the invoice UUID and opens a 400px right drawer with Download / Share / Edit, Send reminder (Pro, editable body from reminders@puyer.org), Set status, a document preview card, and an animated timeline. When status is `PAID`, the timeline includes **Payment Received** at the top; the track stops on the first and last node centers.

Clients: search, Filter, Export, four KPI cards with the same fade sparklines as Home, paginated table. **Add Client** collects name, email (required for reminders), and optional phone. Clicking a row sets `?client=` to the client UUID and opens a 400px right drawer with preview (contact, outstanding, notes), invoice history, Create Invoice, Edit, and Delete (confirm modal). Delete is blocked while the client still has invoices. Create Invoice in the table does not open the drawer. Long client names and addresses truncate or wrap; they do not stretch the left rail or the right drawer.

The invoice drawer timeline is a two-column grid (icon rail + labels). Each node draws its own stem; labels stay in normal flow so status text does not slide.

Drawer Edit goes to `/invoices/:id/edit` for unpaid invoices (including sent/viewed). Paid, partial, and canceled invoices hide Edit.

There is **no** moon/sun control in the app. Visiting the dashboard forces `html[data-theme=light]`.

## How to use

```bash
npm run dev
```

Sign in (magic link), then open http://localhost:3000/dashboard

Unauthenticated visits to `/dashboard`, `/invoices`, `/clients`, `/payments`, `/reports`, `/settings`, `/team`, `/billing`, and `/notifications` redirect to `/login`.

## Examples

- Overview Create Invoice / sidebar New Invoice → `/invoices/new`
- Overview Add Client → modal with name, email (required), and phone; stay on Overview
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

- Sign in, confirm light sidebar + Overview KPIs with sparklines, Revenue Trends filling the card (no Business wall), and readable Quick Actions
- Click an invoice row → right preview drawer + `?invoice=` UUID, Send reminder / Set status, animated timeline, close, URL clears
- Mark an invoice Paid → timeline shows Payment Received; the green track does not run past the last node
- Open `/clients`, click a row, confirm white right drawer + `?client=` UUID, close, URL clears
- Open `/clients`, confirm KPI cards have fade sparklines like Home
- A long client name truncates in the table, drawer, and does not widen the left sidebar
- Client drawer lists invoices; Create Invoice / Edit / Delete work (delete blocked if invoices exist)
- Mobile viewport: bottom tabs; More sheet lists Reports / Settings / Team / Billing / Notifications
- Sidebar icons stay readable when idle (not faint mixed-color SVGs)
- Signed-out `/invoices` and `/clients` redirect to `/login`
- Sign out is in the sidebar (desktop) and More sheet (mobile)
- Public `/invoice/[publicId]` (singular) is not gated by this shell

## Limitations

- Revenue Trends on Overview is the last 6 months of paid totals for every plan (empty state if none). Insights stay on the Business reports gate. Paid (30d) is last 30 days, not lifetime revenue.
- Payments lists synchronized Connect charges. Billing is live (Puyer subscription). Notifications inbox + preferences are live. Reports are live (base KPIs all plans; advanced Business). Team invites are live for Business.
- Desktop sidebar does not collapse to icons; mobile hides the rail.
- Sidebar and mobile tabs use Phosphor duotone icons (same family as marketing). Overview KPI and Quick Action icons are Phosphor too.
- Dashboard routes other than Overview used to hit the page error UI when Prisma/PgBouncer returned `42P05`; Overview swallowed the same failure. Runtime Prisma now forces pooler-safe flags, and list pages render empty instead of `error.tsx`.
- Credit notes and a product catalog are not in v1; those mock items are not routes.

## Modules

- `app/(dashboard)/*`, `components/dashboard/*`
- `lib/dashboard/*`, `lib/clients/list-view.ts`, `lib/clients/input.ts`, `lib/auth/protected-routes.ts`, `proxy.ts`
- `messages/en.json` (`dashboard`)
- `public/app/*.svg`

## Version

1.2.10 — 2026-08-29

## Changelog

```
[2026-08-29] – Fixed: Invoice drawer Edit opens the builder after share/view; paid invoices stay locked.
[2026-08-29] – Added: Add Client collects email and phone; invoice timeline uses a stable two-column rail.
[2026-08-29] – Changed: Revenue Trends fills the card with an SVG gradient; Paid invoices show Payment Received on the timeline.
[2026-08-29] – Added: Invoice drawer Send reminder (editable) and Set status; timeline animates along the track.
[2026-08-29] – Changed: KPI sparklines fade with no stroke; Clients cards match Home; Invoice KPIs use Phosphor; long names no longer stretch the shell.
[2026-08-29] – Added: Clients row opens a 400px right drawer (`?client=`) with preview, history, edit, and delete.
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
[2026-08-29] – Fixed: Invoices/Clients/Payments/Reports/Team/Notifications/Billing survive Prisma pooler `42P05` instead of the page error boundary.
[2026-08-29] – Changed: Overview KPIs use Phosphor icons and sparklines; Revenue Trends is ungated; Quick Actions have contrast.
```
