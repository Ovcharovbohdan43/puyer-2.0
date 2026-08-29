# Marketing landing

## Purpose

Public marketing homepage for Puyer (`/`). Light-first. Implemented from the Figma node `22017:230`. Public header is product chrome (not in that Figma node) and follows [`UX_FLOWS.md`](./UX_FLOWS.md).

Source: [Puyer landing mockup](https://www.figma.com/design/gceJUMGMfVPHmmVOqAeEVx/Photo-portfolio--Copy-?node-id=22017-230)

## Description

Pixel-faithful marketing page using Figma colors, type (Inter + JetBrains Mono), spacing, and **exported Figma icons only**. No generated/AI icons, no Lucide/Heroicons substitutions.

Placeholder blocks labeled “UI Mockup” remain on How / tracking / reminders. The Templates grid (`#templates`) shows live Mini / Professional / Premium invoice previews from the same `InvoicePreview` as the builder. Platform disclaimer copy is hidden on those cards so the layout stays readable.

The Invoice Builder on this page is interactive (see [`invoice-builder.md`](./invoice-builder.md)).

Copy for Stripe/fees follows `PLAN.md`: Puyer does not hold customer funds or charge invoice transaction fees.

## How to use

```bash
npm run dev
```

Open http://localhost:3000

Strings live in `messages/en.json`. Icons live in `public/landing/` (Figma MCP asset downloads).

## How to test

- Desktop: header + hero + 50/50 builder + preview (landing form is two steps), 4-up feature grid, 3-up templates/pricing
- Tablet: grids collapse to 2 columns
- Mobile: header Menu sheet; builder Edit/Preview tabs; FAQ accordion opens
- Header Create Invoice / Login / Pricing match UX_FLOWS.md
- Theme moon/sun restyles the full landing, including builder preview and solid actions
- Pricing toggle switches monthly/yearly
- FAQ answers expand without page navigation
- No AI-style illustrations on feature cards. Template cards render the real invoice layouts. Hovering a card zooms the invoice preview.

## Limitations

- Header was not in the selected Figma node; it uses landing tokens (white, `#006c49` CTA, Inter). Theme uses a moon/sun icon (geometric SVG), not Figma-exported art. See [`theme.md`](./theme.md).
- Yearly prices are 10× monthly (two months free). Figma only showed monthly amounts.
- Magic link send is live (see [`auth.md`](./auth.md)). PDF download and Stripe Connect onboarding are not.

## Modules

- `app/(marketing)/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/(marketing)/pricing/page.tsx`
- `docs/theme.md`
- `components/marketing/*` (`template-invoice-mockup.tsx` for `#templates`)
- `lib/invoices/template-demo.ts`
- `components/invoice-builder/*`
- `messages/en.json`
- `public/landing/*`

## Version

1.2.10 — 2026-08-29

## Changelog

```
[2026-08-27] – Added: Figma landing page (static builder mock).
[2026-08-27] – Changed: Header + live Invoice Builder; static mock replaced.
[2026-08-27] – Added: App-wide dark theme (tokens + data-theme). Moon/sun toggle.
[2026-08-27] – Changed: Remaining light leftovers (preview, Download PDF, icons) follow dark theme.
[2026-08-28] – Changed: Marketing routes live in `app/(marketing)`; magic link is Phase 1.
[2026-08-28] – Changed: Header Login navigates to `/login`.
[2026-08-29] – Changed: Templates section shows live Minimal / Professional / Premium invoice previews.
[2026-08-29] – Fixed: Template card previews scale from the top-left so invoices are not clipped to the right.
[2026-08-29] – Added: Hover zoom on landing template invoice previews.
[2026-08-29] – Changed: Template cards show three distinct invoice layouts (Premium navy header).
[2026-08-29] – Changed: Template mockups hide the invoice platform disclaimer.
[2026-08-29] – Changed: Landing invoice builder is two steps so the hero/preview stay compact.
[2026-08-29] – Changed: Landing builder shows Next first; Download PDF and Share on step 2. Preview scrollbar hidden.
```
