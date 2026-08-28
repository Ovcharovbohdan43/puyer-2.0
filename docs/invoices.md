# Invoice domain (Phase 2)

## Purpose

Persist invoices, clients, line items, and per-organization numbering. Server-side totals, a status machine, an authenticated builder, and a public `/invoice/[publicId]` payer page.

## Description

Money is stored as `bigint` minor units. Totals are recomputed on the server from builder fields (`lib/invoices/compute.ts`). Client-supplied totals are ignored.

Invoice numbers come from `InvoiceSequence` with `SELECT … FOR UPDATE` inside a Repeatable Read transaction. The format is `INV-{year}-{pad4}`. Public links use a 16-byte `base64url` `publicId`, not the invoice number.

Status: `DRAFT → READY → SENT → VIEWED → …`. Create saves as `READY`. Sharing a public link marks `SENT` when that transition is allowed. Opening the public page marks `VIEWED` when that transition is allowed. `OVERDUE` is a display overlay for unpaid invoices past due; it is not written on create.

Cross-tenant reads return **404**, not 403.

Products exist in the schema for later catalog UI. Line items in this phase are free-text.

PDF generation lives in Phase 3 — see [`pdf.md`](./pdf.md). Stripe Checkout is [`stripe-connect.md`](./stripe-connect.md).

## How to use

1. Sign in (magic link).
2. `/invoices/new` — fill the builder, **Save invoice**.
3. `/invoices` — list, filter, drawer. Share copies `/invoice/{publicId}` and may mark sent.
4. `/clients` — add a client, **Create Invoice** (`?client=`).
5. Open the public URL while signed out. The payer sees the invoice document and a **Pay Invoice** sidebar when Stripe is connected.

SQL (already applied remotely in this project): [`supabase/migrations/20260828180000_invoice_domain.sql`](../supabase/migrations/20260828180000_invoice_domain.sql). After `npx prisma generate`, restart `npm run dev` if the Prisma engine was locked.

## Examples

- Two simultaneous creates for the same org: sequence row lock issues `INV-2026-0001` then `INV-2026-0002`.
- Other-org UUID on `/invoices/{id}/edit` → not found.
- `DRAFT` or `CANCELED` public IDs → not found.

## How to test

```bash
npx prisma generate
npm run test
npm run typecheck
npm run lint
```

Browser:

- Save from `/invoices/new` → lands on `/invoices/{id}/edit` with a real number.
- List/drawer/Overview KPIs use saved invoices, not mock figures.
- Copy public link → `/invoice/{publicId}` shows the payer layout (document + pay sidebar).
- With the site in dark mode, invoice and pay-card text stay light on the dark cards.
- Client create + New Invoice with `?client=` prefills the name.

## Limitations

- Product catalog UI is not built (schema only).
- Mixed-currency KPI cards use the most common currency only.
- Paid totals stay `$0` until a Connect webhook marks the invoice `PAID`.

## Modules

- `prisma/schema.prisma`, `supabase/migrations/20260828180000_invoice_domain.sql`
- `lib/invoices/*`, `lib/clients/*`, `lib/authorization/invoice.ts`
- `app/api/invoices/*`, `app/api/clients/*`
- `app/(dashboard)/invoices/*`, `app/(dashboard)/clients/*`, `app/(marketing)/invoice/[publicId]/*`
- `components/invoice-builder/workspace-session.tsx`, `components/dashboard/*`, `components/invoice/public-invoice-screen.tsx`, `components/invoice/public-pay-panel.tsx`

## Version

1.0.7 — 2026-08-28

## Changelog

```
[2026-08-28] – Added: Invoice domain persist, numbering, publicId, authenticated builder, public page (no pay).
[2026-08-28] – Changed: PDF download and public rate limits moved to docs/pdf.md (Phase 3).
[2026-08-28] – Changed: Public Pay via connected-account Checkout (Phase 4).
[2026-08-28] – Changed: Mark as sent emails the client when Resend is configured.
[2026-08-28] – Changed: Public payer page matches the document + pay-sidebar layout.
[2026-08-28] – Fixed: Long addresses wrap on the public invoice page.
[2026-08-28] – Fixed: Builder save highlights invalid fields; blank extra line items are dropped.
[2026-08-28] – Fixed: Public payer portal contrast in dark theme (token colors).
```
