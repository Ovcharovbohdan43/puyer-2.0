# Invoice Builder (public)

## Purpose

Interactive public Invoice Builder on `/#builder`, wired to the public header. Unauthenticated users can fill an invoice and see a live preview without registering.

## Description

Follows [`docs/UX_FLOWS.md`](./UX_FLOWS.md). Header **Create Invoice** and the hero CTA scroll to the builder and focus `#invoice-business-name`. They do **not** open login.

The builder keeps invoice data in memory only. Refresh discards it. There is no unauthenticated draft persistence.

Totals use integer minor units (`bigint`). The displayed invoice number (`INV-2026-001`) is preview-only on the public landing builder. After authenticated save, the server issues `INV-{year}-{pad4}`.

Download PDF / Share for guests: validate → progress copy → registration modal (“Your invoice is ready”) → email-first magic-link UI. Continue with email posts to `/api/auth/otp`. After the link, login goes to `/dashboard`; download/share return to `/?resume=download|share`. Authenticated Download PDF hits `GET /api/invoices/{id}/pdf`.

Leaving `/` for `/pricing` (or any non-hash route) while the builder is dirty opens **Leave without saving?**

## How to use

1. Open `/`.
2. Click **Create Invoice** in the header or hero.
3. Edit business, client, line items, tax, discount, template, accent.
4. Preview updates on every change (desktop split; mobile Edit/Preview tabs). On the landing page the form is two steps: invoice details, then payment and notes. `/invoices/new` and edit stay a single form.
5. Click Download or Share to hit validation + registration modal.

## Examples

- Currency change with existing line items → warning modal, numeric strings unchanged.
- Template icons switch Minimal / Professional / Premium without clearing data. Layouts differ: Minimal is sparse, Professional uses the accent, Premium has a navy header and totals panel.
- Login in the header navigates to `/login` (email magic link, Sign in / Create account).

## How to test

```bash
npm run test
npm run typecheck
npm run dev
```

Browser:

- Header Create Invoice scrolls to builder and focuses business name.
- Landing builder: **Next** opens payment & notes; **Download PDF** and **Share** appear on that second step. **Back** returns to invoice details. Dashboard builder is still one page.
- Typing a line item updates preview totals immediately.
- Download with empty client name shows inline errors and a red border, no modal.
- Save invoice with an empty extra line item still saves the filled lines.
- Valid Download shows preparing copy, then registration modal with the Figma header illustration above “Your invoice is ready”.
- Ready modal states that download/share requires register or log in, with Register and Log in actions.
- Login → Continue with email → Check your inbox; Resend has a 30s cooldown.
- Dirty builder + header Pricing → leave confirmation. Continue editing stays. Leave discards state.
- `/pricing` Free **Get Started** returns to `/#builder`. Pro/Business opens login.
- Theme moon/sun restyles builder chrome, modals, and the live invoice preview.
- Dark theme: form fields and Premium billed-to/table stripes stay dark, not white.
- Notes always prints a small Puyer platform disclaimer under the issuer’s notes (not editable).
- Bank transfer fields are optional. A checkbox must be checked before Save/PDF if those details should be stored. Unchecked: details stay on-screen only, are not sent/saved, and must be re-entered later.
- Line items: Qty, Price, and Amount stay in separate columns; `$2,500.00` does not cover `2500.00`.
- A long address without spaces wraps inside the paper; **Invoice** and `#INV-…` stay visible.

```bash
npm run test:e2e -- e2e/builder-preview.spec.ts
```
- Currency control shows `USD ($)` when closed; full names only in the dropdown.
- Currency list closes on outside click, Escape, or choosing a currency.
- Landing: Download PDF is not on step 1; click Next first.
- Discount uses the same custom list as Currency: outside click, Escape, or a choice closes it. Tax % matches that control height.
- Address and notes fields have no resize handle.

## Limitations

- Unauthenticated refresh loses builder state (intentional). The public landing builder still does not persist.
- Authenticated `/invoices/new` saves through `POST /api/invoices` and then `/invoices/{id}/edit`.
- Authenticated Download PDF requires a saved invoice (the builder saves first).

## Modules

- `components/invoice-builder/*`
- `components/marketing/public-header.tsx`, `public-chrome.tsx`, `public-ctas.tsx`
- `components/ui/theme.tsx`, `components/ui/theme-toggle.tsx`
- `lib/invoices/*`, `lib/theme.ts`
- `app/(marketing)/pricing/page.tsx`
- `messages/en.json` (`header`, `auth`, `leave`, `builder`)

## Version

1.2.13 — 2026-08-29

## Changelog

```
[2026-08-27] – Added: Public header + interactive landing Invoice Builder
  with live preview, validation, auth/registration/leave modals, and /pricing.
[2026-08-27] – Fixed: Line-item Price/Amount columns no longer overlap.
  Currency closed state is compact `USD ($)` without a stretched symbol.
[2026-08-27] – Fixed: Discount is a custom list (not native select).
  Closes on outside click and Escape; height matches Tax %.
[2026-08-27] – Added: Figma visual header on the “Your invoice is ready” modal.
[2026-08-27] – Changed: Ready modal states register/log in is required to
  download or share. Adds Register (primary) and Log in actions.
[2026-08-27] – Added: Dark theme for builder chrome; invoice paper stays white.
[2026-08-27] – Changed: Invoice preview and Download PDF follow dark theme.
[2026-08-28] – Changed: Magic link posts to `/api/auth/otp`. Auth Create Invoice goes to `/invoices/new` (stub).
[2026-08-28] – Changed: Authenticated builder saves invoices and copies `/invoice/{publicId}`.
[2026-08-28] – Changed: Authenticated Download PDF generates a stored PDF. Share menu copies/mailto/WhatsApp/native.
[2026-08-28] – Fixed: Long address text wraps in the live preview instead of covering the invoice number.
[2026-08-28] – Fixed: Save validates on the client, highlights invalid fields, and ignores blank extra line items.
[2026-08-28] – Changed: Header Login goes to `/login`; Download/Share still use the registration modal.
[2026-08-29] – Changed: Minimal / Professional / Premium preview layouts are visually distinct.
[2026-08-29] – Fixed: Dark theme fields and Premium preview panels no longer stay white.
[2026-08-29] – Added: Every invoice prints a small Puyer platform disclaimer under Notes.
[2026-08-29] – Added: Optional bank transfer details; stored only with an explicit storage-consent checkbox.
[2026-08-29] – Changed: Landing builder form is two steps; dashboard builder stays one page.
[2026-08-29] – Changed: Landing Download PDF / Share wait until step 2; preview scrollbar is hidden.
[2026-08-29] – Changed: Landing Next is the green CTA with hover/press motion so it does not blend into the form.
[2026-08-29] – Changed: Download PDF and Share use the same contrast + hover/press treatment.
[2026-08-29] – Changed: Download PDF and Share use brand green (`#006c49` / `--puyer-green`).
```
