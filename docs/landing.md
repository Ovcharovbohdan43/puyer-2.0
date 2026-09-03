# Marketing landing

## Purpose

Public marketing homepage for Puyer (`/`). Light-first. Implemented from the Figma node `22017:230`. Public header is product chrome (not in that Figma node) and follows [`UX_FLOWS.md`](./UX_FLOWS.md).

Source: [Puyer landing mockup](https://www.figma.com/design/gceJUMGMfVPHmmVOqAeEVx/Photo-portfolio--Copy-?node-id=22017-230)

## Description

Pixel-faithful marketing page using Figma colors, type (Inter + JetBrains Mono), and spacing. Feature cards, How, Why, Stripe, pricing, and the trust bar use **Phosphor Icons** (`@phosphor-icons/react`, duotone, MIT). Other chrome (header, builder, FAQ) still uses exported Figma SVGs in `public/landing/`.

The How section (`HowItWorks`) is a three-step track: Phosphor badges and titles centered in each column, a connector line through the icon centers on desktop, product screenshots in `public/landing/how-*.png` (Next.js `Image`, hover zoom, `LandingReveal`). Tracking and reminders use the chosen light product stills (`tracking-payments.jpg`, `reminders-pro.jpg`) with a thin white edge blend. Clients and reports use the same zigzag as tracking / reminders: clients still on the left with copy on the right, reports copy on the left with the still on the right. The clients block is title + still only (no Manage clients button). Screenshot and copy slide in from opposite sides (`LandingReveal`, respects `prefers-reduced-motion`). Landing and `/pricing` stay light: no moon/sun control, `marketing-shell` ignores `html[data-theme=dark]`. The Templates grid (`#templates`) shows stills of Minimal / Professional / Premium invoices (`public/landing/template-*.png`, Next.js `Image`, hover zoom). **Use this template** still applies that layout in the builder. The Features row (`#features`) is an infinite horizontal marquee (`FeaturesMarquee`); it keeps scrolling on hover; `prefers-reduced-motion` shows a wrapping static set. The Why block keeps the same headline/body, then two opposite Phosphor chip marquees for the ten capabilities (no Figma checkmarks).

The Invoice Builder on this page is interactive (see [`invoice-builder.md`](./invoice-builder.md)). It is **server-rendered in the first HTML** (the live preview is the LCP candidate). Template cards use static invoice images below the fold. `PublicChrome` does not wrap the page in a header-only `Suspense` fallback. Measure LCP on a production build (`next start` or Vercel), not `next dev`.

Copy for Stripe/fees follows `PLAN.md`: Puyer does not hold customer funds or charge invoice transaction fees. The Stripe block (`#stripe`, `StripeFlow`) uses Phosphor duotone nodes (customer → Stripe → business), the required note, and Connect Stripe. Pricing (`#pricing`, `PricingSection`) is a lavender band with a Monthly/Yearly segmented control, Phosphor plan icons, CheckCircle feature rows, and a highlighted Pro card. Checkout and plan prices are unchanged. The trust bar (`#trust`, `TrustBar`) stays dark and uses Phosphor Lock / Shield / ShieldCheck chips with the same three copy lines.

## How to use

```bash
npm run dev
```

Open http://localhost:3000

Strings live in `messages/en.json`. Feature icons come from `@phosphor-icons/react`. Other icons live in `public/landing/` (Figma MCP asset downloads).

## How to test

- Desktop: header + hero + 50/50 builder + preview in the first HTML (landing form is two steps), feature marquee, 3-up templates/pricing
- LCP: production/Vercel only — `next dev` compile time shows as element render delay
- Tablet: grids collapse to 2 columns; feature marquee still scrolls horizontally
- Mobile: header Menu sheet; builder Edit/Preview tabs; FAQ accordion opens
- Header Create Invoice / Login / Pricing / Help match UX_FLOWS.md; header brand is the lockup image
- Marketing CTAs (header, hero, templates, Stripe, pricing, FAQ, footer) have a light hover; reduced-motion drops the lift
- Landing and `/pricing` stay light (no theme toggle)
- Pricing toggle switches monthly/yearly (segmented control; prices stay $0 / $9 / $29 monthly and 10× yearly)
- FAQ answers expand without page navigation; copy matches live product (sign-in for PDF, Stripe on Pro, client pay without an account)
- Template cards show the three invoice stills; hover zooms the image; **Use this template** still applies Minimal / Professional / Premium
- Hovering the feature marquee or Why chips does not pause the scroll.
- No AI-style illustrations on feature cards. Feature icons are Phosphor duotone. How steps use Phosphor badges plus product screenshots (Create / Send / Get Paid), with hover zoom. The Stripe block uses Phosphor nodes (customer → Stripe → business) and the required payment note. The dark trust bar uses Phosphor chips for Stripe / GDPR / data. Tracking / reminders / clients / reports use product stills and fade/slide in when they enter the viewport.

## Limitations

- Header was not in the selected Figma node; it uses landing tokens (white, `#006c49` CTA, Inter). There is no theme toggle on landing or `/pricing`. See [`theme.md`](./theme.md).
- Yearly prices are 10× monthly (two months free). Figma only showed monthly amounts.
- Magic link send is live (see [`auth.md`](./auth.md)). PDF download and Stripe Connect onboarding are not.

## Modules

- `app/(marketing)/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/(marketing)/pricing/page.tsx`, `app/(marketing)/privacy|terms|cookies/page.tsx`, `app/help/page.tsx`
- `docs/brand.md`
- `components/marketing/*` (`landing-template-still.tsx` for `#templates` invoice images, `features-marquee.tsx` for `#features`, `how-it-works.tsx` for Create/Send/Get Paid, `why-benefits.tsx` for the capability chips, `stripe-flow.tsx` for `#stripe`, `pricing-section.tsx` for `#pricing`, `trust-bar.tsx` for `#trust`, `landing-studio-shot.tsx` / `landing-reveal.tsx` for tracking and reminders)
- `lib/invoices/template-demo.ts`
- `components/invoice-builder/*`
- `messages/en.json`
- `public/landing/*`

## Version

1.2.36 — 2026-09-03

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
[2026-08-29] – Changed: Template cards share one Figma invoice skeleton with different paint.
[2026-08-29] – Changed: Template mockups hide the invoice platform disclaimer.
[2026-08-29] – Changed: Landing invoice builder is two steps so the hero/preview stay compact.
[2026-08-29] – Changed: Landing builder shows Next first; Download PDF and Share on step 2. Preview scrollbar hidden.
[2026-08-29] – Added: How-section product screenshots (Create / Send / Get Paid) in `public/landing/how-*.png`.
[2026-08-29] – Added: Tracking / reminders studio shots with CSS vignette and scroll reveal.
[2026-08-29] – Changed: Landing stays light (no dark theme). Tracking/reminders shots are light UI with a light edge feather.
[2026-08-29] – Changed: Tracking / reminders use the selected product stills (`tracking-payments.jpg`, `reminders-pro.jpg`).
[2026-08-29] – Added: Clients / reports cards use light product stills (`clients.png`, `reports.png`).
[2026-08-29] – Changed: Clients / reports stills match the invoices dashboard (KPI cards, thin circular icons, status pills).
[2026-08-29] – Changed: Clients / reports copy and screenshots slide in from opposite sides.
[2026-08-29] – Changed: Clients / reports use the tracking/reminders zigzag (image+text, then text+image).
[2026-08-29] – Changed: Public header and footer use the Puyer lockup image.
[2026-08-29] – Changed: Features use Phosphor duotone icons in a horizontal marquee.
[2026-08-29] – Changed: Why-section capabilities are Phosphor chips in dual marquees.
[2026-08-29] – Changed: How section is a Phosphor step track with screenshot hover zoom.
[2026-08-29] – Fixed: How stepper icons, labels, and connector line are centered in each column.
[2026-08-29] – Changed: Stripe block uses Phosphor duotone nodes (customer → Stripe → business).
[2026-08-29] – Changed: Removed the clients “Manage clients” button; remaining marketing CTAs have a light hover.
[2026-08-29] – Changed: Shared footer links Privacy, Terms, Cookie Policy, and Cookie settings.
[2026-08-29] – Changed: Pricing uses Phosphor plan cards and a Monthly/Yearly segmented control.
[2026-08-29] – Changed: Trust bar uses Phosphor chips; copy is unchanged.
[2026-08-29] – Changed: FAQ answers real signup questions and no longer claims guest PDF download.
[2026-08-30] – Fixed: Landing LCP — hero is in the first HTML; Invoice Builder loads after paint.
[2026-08-30] – Fixed: `ssr: false` for the builder lives in a Client Component (`LandingInvoiceBuilder`).
[2026-09-03] – Changed: Feature and Why marquees keep scrolling on hover.
[2026-09-03] – Changed: Templates section uses still images of Minimal / Professional / Premium invoices.
[2026-08-30] – Fixed: In-viewport builder is SSR again (lazy builder made LCP worse); template invoices lazy-load below the fold.
[2026-08-29] – Added: Header and footer Help links to `/help`.
```
