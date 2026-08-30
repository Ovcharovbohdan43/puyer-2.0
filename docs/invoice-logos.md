# Company logos on invoices

## Purpose

Let issuers put a company logo on the invoice, with a preview editor (crop, size, background removal) before the file is used.

## Description

Logos are edited in the browser, then stored as PNG in the public `org-logos` Supabase Storage bucket (`{organizationId}/{uuid}.png`). The invoice row snapshots `logoUrl` and `logoScale` (40–160, default 100). The workspace `BusinessProfile.logoUrl` is updated on upload so new invoices can reuse it.

There is **no Railway image worker**. Background removal is a corner flood-fill on a flat plate (typical logo on white). PNG is recommended so transparency survives. JPEG/WebP are accepted; the editor always exports PNG.

Guests can preview with a `blob:` URL. Persist uploads through `POST /api/logos` (session, `logo-upload` rate limit, magic-byte validation, 2 MB). The server stores only `https://` URLs.

HTML preview, public payer page, and PDF (`@react-pdf/renderer` `Image`) all read the same URL. The PDF logo is a shrink-wrapped left-aligned box (`invoicePdfLogoStyle`); Yoga otherwise stretches Image across the header column and `objectFit: contain` centers the mark. PDF cache hash includes `layout: 12`, `logoUrl`, and `logoScale`.

## How to use

1. Apply [`supabase/migrations/20260830120000_invoice_logos.sql`](../supabase/migrations/20260830120000_invoice_logos.sql) and `npx prisma generate`.
2. Set `SUPABASE_SERVICE_ROLE_KEY` so uploads can write to Storage.
3. In the Invoice Builder under **Your Business**, **Add logo**, adjust crop/size, optionally **Remove background**, **Use this logo**.

## Examples

- PNG on a white rectangle → Remove background → checkerboard shows transparency → invoice header shows the mark without a box.
- Guest landing builder: logo stays local until sign-in + save.
- Missing service role → upload returns a validation error; the invoice can still save without a logo.

## How to test

```bash
npx prisma generate
npm run test
npm run typecheck
```

Browser: add a PNG, crop, remove background, confirm live preview, save, download PDF, open `/invoice/{publicId}`.

## Limitations

- Flood-fill cannot cut a photo of a person off a busy scene. Use a logo file with a solid plate.
- Old Storage objects are not deleted when the logo is replaced.
- PDF embedding needs the public URL to be reachable from the Node renderer.

## Modules

- `components/invoice-builder/logo-editor.tsx`, `invoice-builder.tsx`, `invoice-preview.tsx`
- `lib/invoices/logo.ts`, `logo-bg.ts`, `upload-logo.ts`, `persist.ts`, `builder-state.ts`, `validate.ts`
- `lib/storage/org-logo.ts`, `app/api/logos/route.ts`
- `lib/pdf/document.tsx`, `lib/pdf/hash.ts`, `lib/pdf/public-view.ts`
- `prisma/schema.prisma`, `supabase/migrations/20260830120000_invoice_logos.sql`

## Version

1.0.2 — 2026-08-30

## Changelog

```
[2026-08-30] – Fixed: PDF logo sits left above the business name (not centered in the header column). Cache key `layout: 12`.
[2026-08-30] – Changed: PDF hash `layout: 11` (payment channel included).
[2026-08-30] – Added: Invoice company logo with in-browser crop, scale, and background removal; public Storage + snapshot on Invoice.
```
