# Legal pages and cookie consent

## Purpose

Public Privacy Policy, Terms of Service, Cookie Policy, and a first-visit cookie choice window for Puyer.

## Description

Policies are written for this product: invoicing SaaS, email magic link, Stripe Connect (user is merchant of record for invoice payments), Puyer Pro/Business subscriptions only, no invoice application fees, processors (Supabase, Vercel, Stripe, Resend, Inngest, optional Upstash). Copy does not claim Puyer is “never legally responsible for anything.”

The cookie window records a versioned choice in `localStorage` (`puyer-cookie-consent`). Necessary cookies (Auth, return path, the choice itself) always run. Analytics and marketing scripts must not load unless `analyticsAllowed` / `marketingAllowed` is true. No advertising or third-party analytics are shipped today; those toggles exist so a later script can respect the stored choice.

## How to use

- `/privacy`, `/terms`, `/cookies`
- Footer: legal links + **Cookie settings** (reopens the window)
- `/login`: agreement line under Continue with email
- First visit: floating card — Accept all, Reject optional, or Customize

Contact: `privacy@puyer.org` (data) and `support@puyer.org` (product). Product questions can also go through `/help`. Confirm registered address and governing-law details with counsel before treating the pages as a filed legal product.

## Examples

```ts
import { parseCookieConsent, analyticsAllowed } from "@/lib/cookies/consent";

const consent = parseCookieConsent(localStorage.getItem("puyer-cookie-consent"));
if (analyticsAllowed(consent)) {
  // load first-party or vendor analytics
}
```

## How to test

```bash
npm run test
```

Browser: open `/` with a clean origin (no `puyer-cookie-consent`). Accept, reload (window gone). Footer Cookie settings reopens it. `/privacy` and `/terms` render. Reject optional, then confirm no analytics load (none are bundled).

## Limitations

- Not a substitute for a lawyer review, DPA, or a company registered-office filing.
- Governing law is stated as Delaware, matching “Puyer Inc.” in the footer; change this if the entity is elsewhere.
- Theme (`puyer-theme`) is still read by the theme bootstrap regardless of the Preferences toggle, so the public invoice page does not flash; the toggle records preference for future gating.

## Modules

- `lib/legal/company.ts`, `lib/legal/policies.ts`, `lib/cookies/consent.ts`
- `components/legal/*`, `components/cookies/*`
- `app/(marketing)/privacy/page.tsx`, `terms`, `cookies`
- `components/marketing/public-chrome.tsx`, `components/providers.tsx`
- `messages/en.json`

## Version

1.0.2 — 2026-08-30

## Changelog

```
[2026-08-30] – Changed: Terms state bans can be temporary or permanent and are emailed with a stored reason.
[2026-08-29] – Changed: Product support also runs through `/help`.
[2026-08-29] – Added: Privacy, Terms, Cookie Policy, cookie choice window, footer legal links.
```
