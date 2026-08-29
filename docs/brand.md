# Brand mark

## Purpose

The Puyer wordmark-and-icon lockup used in product chrome, login, public invoice, invite, emails, and the site favicon.

## Description

The mark lives at `public/brand/puyer-logo.png` (teal segmented ring + “Puyer” wordmark, **transparent** background). UI uses a native `<img>` (`PuyerLogo`) so image optimization cannot replace PNG alpha with a white plate. On dark chrome (`onDark`) the mark is inverted to white. App emails and Auth HTML templates load the same file from an absolute URL (`puyerLogoAbsoluteUrl()`, production `https://puyer.org/brand/puyer-logo.png`). Sentence-level “Puyer” copy is unchanged.

## How to use

```tsx
import { PuyerLogo } from "@/components/brand/puyer-logo";

<PuyerLogo height={32} />
<PuyerLogo height={28} onDark />
```

After changing Auth HTML, run `npm run auth:push-templates`.

## How to test

```bash
npm run test
```

Browser: header, `/login`, `/dashboard` sidebar, `/pricing` footer, public invoice header show the lockup, not plain text.

## Limitations

- Wide lockup is not a square favicon; browsers scale it.
- Auth templates need a public origin so inboxes can fetch the PNG.

## Modules

- `public/brand/puyer-logo.png`
- `components/brand/puyer-logo.tsx`, `lib/brand.ts`
- `app/layout.tsx` (icons)
- `lib/email/layout.ts`, `supabase/templates/*.html`

## Version

1.0.2 — 2026-08-29

## Changelog

```
[2026-08-29] – Added: Site-wide Puyer lockup (`public/brand/puyer-logo.png`).
[2026-08-29] – Changed: Logo PNG is transparent; inverted on dark chrome.
[2026-08-29] – Fixed: Logo is a native `<img>` so PNG alpha is not flattened to white.
```
