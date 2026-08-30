# PDF and sharing (Phase 3)

## Purpose

Generate invoice PDFs on the server, cache them in private Supabase Storage, and let owners and invoice recipients download them. Public invoice pages stay unguessable and rate-limited.

## Description

PDFs use `@react-pdf/renderer` (no Chromium). All three templates share one Figma document skeleton (business mark left, INVOICE + number right, billed-to / dates, item table with unit price and tax %, navy-style Total due, full-width payment). Paint only:

- **Minimal** — sparse type, no zebra, no filled Total due bar.
- **Professional** — grey table header, zebra rows, Total due bar in the accent color (black swatch uses navy).
- **Premium** — accent top stripe, table header, and Total due bar. Never shows Puyer branding.

Page size is A4 by default or US Letter via `?paper=letter`.

Minimal (and Free-plan non-Premium invoices) show a subtle “Made with Puyer” footer. Every invoice also prints a small platform disclaimer under Notes (`lib/invoices/disclaimer.ts`). That is not marketing branding and is not omitted on Premium.

The file is hashed from invoice content + paper + branding. The object path is `{invoiceId}/{paper}/{hash}.pdf` in the private `invoice-pdfs` bucket — no organization id in the path. If `SUPABASE_SERVICE_ROLE_KEY` is missing, the PDF is still generated and streamed; it is just not cached.

Authenticated download: `GET /api/invoices/{id}/pdf`  
Public download: `GET /api/public/invoices/{publicId}/pdf`  

Public HTML at `/invoice/{publicId}` is a payer layout (invoice document + pay sidebar). It uses a view object that omits `organizationId`, `clientId`, `createdByUserId`, and row UUIDs. Cross-tenant and draft/canceled ids remain 404.

Rate limits (in-process until Upstash in Phase 9): 60 HTML GETs / minute / IP+id, 20 public PDFs / minute, 30 owner PDFs / minute.

Share menu (authenticated): copy link, mailto, WhatsApp, native share. Transactional email send is still Phase 6.

## How to use

1. Apply [`supabase/migrations/20260828190000_invoice_pdf_storage.sql`](../supabase/migrations/20260828190000_invoice_pdf_storage.sql) (bucket). Optional: set `SUPABASE_SERVICE_ROLE_KEY` for Storage cache.
2. Sign in, save an invoice, click **Download PDF** in the builder or drawer.
3. Open `/invoice/{publicId}`: the payer sees the invoice document, **Pay Invoice** (when Stripe is connected), and **Download PDF**.

## Examples

- `GET /api/invoices/{uuid}/pdf?paper=letter`
- Invalid or draft `publicId` → 404 JSON, no org id in the body
- Too many public page hits → 429

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Browser:

- Authenticated Download PDF saves a file named `INV-….pdf`
- Public page Download PDF works signed out
- A very long address without spaces stays inside the page **in both the HTML preview and the downloaded PDF**
- Cyrillic (and other Noto-covered scripts) render as real letters in the PDF, not `?`
- After a renderer change, download again — Storage cache keys include `layout: 10`
- View-source / network on the public page has no `organizationId`

## Limitations

- In-process rate limits are per server isolate (Upstash in Phase 9).
- Storage cache needs the service role key.
- Email “send invoice” still opens `mailto:` (Resend is Phase 6).
- Visual parity with the HTML preview is close, not pixel-identical.
- PDF text uses embedded Noto Sans (SIL OFL). Helvetica is not used for body copy because it cannot encode Cyrillic.
- Unbreakable strings wrap by character (hyphenation callback + zero-width spaces). Yoga still needs `flexBasis: 0` on text columns or a long token will blow the row width.

## Modules

- `lib/pdf/*`, `lib/pdf/hyphenate.ts`, `lib/pdf/fonts.ts`, `lib/pdf/fonts/*.ttf`, `lib/storage/*`, `lib/rate-limit/*`
- `app/api/invoices/[id]/pdf/route.ts`, `app/api/public/invoices/[publicId]/pdf/route.ts`
- `app/(marketing)/invoice/[publicId]/page.tsx`
- `components/invoice/public-invoice-screen.tsx`, `components/invoice/public-pay-panel.tsx`
- `components/invoice-builder/*`, `components/dashboard/invoice-drawer.tsx`
- `proxy.ts`, `next.config.ts`, `supabase/migrations/20260828190000_invoice_pdf_storage.sql`

## Version

1.0.10 — 2026-08-30

## Changelog

```
[2026-08-28] – Added: Server PDF (A4/Letter, three templates), Storage cache, public download, rate limits.
[2026-08-28] – Changed: Public HTML is the payer document + sidebar, not the builder preview.
[2026-08-28] – Fixed: Long unbreakable address strings wrap in the HTML preview.
[2026-08-28] – Fixed: Downloaded PDF wraps long tokens (flexBasis 0 + character hyphenation) and embeds Noto Sans so Cyrillic is not `?`. Cache key `layout: 3`.
[2026-08-29] – Changed: Minimal / Professional / Premium layouts are distinct (Premium navy band + totals). Cache key `layout: 4`.
[2026-08-29] – Added: Platform disclaimer under Notes on every PDF. Cache key `layout: 5`.
[2026-08-29] – Added: Bank transfer block on the PDF when the issuer consented to store it. Cache key `layout: 6`.
[2026-08-29] – Changed: PDFs use the shared Figma invoice skeleton for every template. Cache key `layout: 7`.
[2026-08-29] – Changed: PDF payment block is full width; Terms & conditions column removed. Cache key `layout: 8`.
[2026-08-30] – Added: Company logo on the PDF when `logoUrl` is https. Cache key `layout: 10`.
[2026-08-29] – Changed: Filled Total due bar uses the invoice accent. Cache key `layout: 9`.
```
