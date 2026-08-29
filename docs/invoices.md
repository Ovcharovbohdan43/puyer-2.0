# Invoice domain (Phase 2)

## Purpose

Persist invoices, clients, line items, and per-organization numbering. Server-side totals, a status machine, an authenticated builder, and a public `/invoice/[publicId]` payer page.

## Description

Money is stored as `bigint` minor units. Totals are recomputed on the server from builder fields (`lib/invoices/compute.ts`). Client-supplied totals are ignored.

Every invoice prints a small platform disclaimer under Notes (`lib/invoices/disclaimer.ts`). It is not stored in `Invoice.notes` and issuers cannot remove it. Copy follows PLAN: Puyer is invoicing software, not a party to the transaction, and does not claim “never legally responsible for anything.”

Issuers may add **bank transfer** details (outside Stripe). Those fields are stored on the invoice only when `storeBankDetailsConsent` is true. The server strips IBAN/account fields without that flag (`paymentDetailsForStorage`). Without consent they appear only in the live preview and must be re-entered later. Puyer does not confirm bank payments.

Invoice numbers come from `InvoiceSequence` with `SELECT … FOR UPDATE` inside a Repeatable Read transaction. The format is `INV-{year}-{pad4}`. Public links use a 16-byte `base64url` `publicId`, not the invoice number.

Status: `DRAFT → READY → SENT → VIEWED → …`. Create saves as `READY`. Sharing a public link marks `SENT` when that transition is allowed. Opening the public page marks `VIEWED` when that transition is allowed. `OVERDUE` is a display overlay for unpaid invoices past due; it is not written on create.

Unpaid invoices (`DRAFT`, `READY`, `SENT`, `VIEWED`, stored `OVERDUE`) stay editable in `/invoices/{id}/edit`. `PAID`, `PARTIALLY_PAID`, and `CANCELED` are locked (no “Coming next” placeholder).

Cross-tenant reads return **404**, not 403.

Products exist in the schema for later catalog UI. Line items in this phase are free-text.

PDF generation lives in Phase 3 — see [`pdf.md`](./pdf.md). Stripe Checkout is [`stripe-connect.md`](./stripe-connect.md).

## How to use

1. Sign in (magic link).
2. `/invoices/new` — fill the builder, **Save invoice**.
3. `/invoices` — list, filter, drawer. Share copies `/invoice/{publicId}` and may mark sent. Drawer can send a Pro reminder and apply allowed status changes. Setting **Paid** adds a Payment Received timeline node (date from `updatedAt`).
4. `/clients` — add a client (name, email, optional phone), row drawer (`?client=`), **Create Invoice** (`/invoices/new?client=`).
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
- Drawer Edit on a sent/viewed invoice opens the same builder; paid invoices hide Edit.
- List/drawer/Overview KPIs use saved invoices, not mock figures.
- Copy public link → `/invoice/{publicId}` shows the payer layout (document + pay sidebar).
- With the site in dark mode, invoice and pay-card text stay light on the dark cards.
- Client create + New Invoice with `?client=` prefills the name.
- Clients list row → drawer with history; PATCH/DELETE `/api/clients/[id]`.

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

1.0.16 — 2026-08-29

## Changelog

```
[2026-08-29] – Fixed: Sent and viewed invoices stay editable; paid/canceled stay locked without a “Coming next” stub.
[2026-08-29] – Changed: Creating or updating a client requires a valid email (reminders destination) and accepts phone.
[2026-08-29] – Added: Paid invoices expose `paidAt` on list rows and a Payment Received timeline event.
[2026-08-29] – Added: Invoice drawer manual reminder and status transitions (`/remind`, `/status`).
[2026-08-29] – Changed: Invoice list KPI cards use Phosphor icons; long client names truncate.
[2026-08-29] – Added: Client drawer on `/clients` (`?client=`), PATCH/DELETE `/api/clients/[id]`.
[2026-08-28] – Added: Invoice domain persist, numbering, publicId, authenticated builder, public page (no pay).
[2026-08-28] – Changed: PDF download and public rate limits moved to docs/pdf.md (Phase 3).
[2026-08-28] – Changed: Public Pay via connected-account Checkout (Phase 4).
[2026-08-28] – Changed: Mark as sent emails the client when Resend is configured.
[2026-08-28] – Changed: Public payer page matches the document + pay-sidebar layout.
[2026-08-28] – Fixed: Long addresses wrap on the public invoice page.
[2026-08-28] – Fixed: Builder save highlights invalid fields; blank extra line items are dropped.
[2026-08-28] – Fixed: Public payer portal contrast in dark theme (token colors).
[2026-08-29] – Added: Platform disclaimer under Notes on every invoice (HTML, PDF, public page).
[2026-08-29] – Added: Bank transfer details on invoices; stored only with explicit storage consent.
[2026-08-29] – Changed: Invoice/client lists load scalar invoice fields only (no line-item join).
```
