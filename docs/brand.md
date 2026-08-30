# Brand mark

## Purpose

The Puyer wordmark-and-icon lockup used in product chrome, login, public invoice, invite, emails, and the site favicon.

## Description

The mark lives at `public/brand/puyer-logo.png` (teal segmented ring + “Puyer” wordmark, **transparent** background). UI uses a native `<img>` (`PuyerLogo`) so image optimization cannot replace PNG alpha with a white plate. On dark chrome (`onDark`) the mark is inverted to white. App emails and Auth HTML templates load the same file from an absolute URL (`puyerLogoAbsoluteUrl()`, production `https://puyer.org/brand/puyer-logo.png`). Sentence-level “Puyer” copy is unchanged.

The tab icon is the ring only (no wordmark): `app/icon.svg`, `app/apple-icon.png`, and `public/brand/puyer-favicon.png`. Next.js file conventions inject `<link rel="icon">` and Apple touch; `metadata.icons` must not point at the wide lockup.

Route transitions and in-button waits use `PuyerSpinner` (forest `#006c49` arc). `app/**/loading.tsx` shows `PuyerRouteLoading`. Primary actions that already had a pending flag use `PuyerBusyText`.

## How to use

```tsx
import { PuyerLogo } from "@/components/brand/puyer-logo";

<PuyerLogo height={32} />
<PuyerLogo height={28} onDark />
```

`PuyerSpinner` / `PuyerBusyText` / `PuyerRouteLoading` from `@/components/brand/puyer-spinner` for waits.

After changing Auth HTML, run `npm run auth:push-templates`.

## How to test

```bash
npm run test
```

Browser: header, `/login`, `/dashboard` sidebar, `/pricing` footer, public invoice header show the lockup, not plain text. The browser tab shows the segmented teal ring, not the full wordmark.

## Limitations

- Auth templates need a public origin so inboxes can fetch the PNG.

## Modules

- `public/brand/puyer-logo.png`, `public/brand/puyer-favicon.png`
- `app/icon.svg`, `app/apple-icon.png`
- `components/brand/puyer-logo.tsx`, `components/brand/puyer-spinner.tsx`, `lib/brand.ts`
- `app/layout.tsx`
- `lib/email/layout.ts`, `supabase/templates/*.html`

## Version

1.2.0 — 2026-08-30

## Changelog

```
[2026-08-30] – Added: Forest-green loading spinner on route waits and pending buttons.
[2026-08-29] – Added: Square favicon (segmented teal ring) via app/icon.svg and apple-icon.png.
[2026-08-29] – Added: Site-wide Puyer lockup (`public/brand/puyer-logo.png`).
[2026-08-29] – Changed: Logo PNG is transparent; inverted on dark chrome.
[2026-08-29] – Fixed: Logo is a native `<img>` so PNG alpha is not flattened to white.
```
