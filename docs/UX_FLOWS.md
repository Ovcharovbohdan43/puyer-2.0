# Puyer — Complete User Flow & Interaction System

> **Status:** Canonical interaction contract.  
> **Follow with:** [`PLAN.md`](../PLAN.md) (architecture, Stripe separation, data).  
> **If UI and this file disagree, update this file first.**  
> **Version:** 1.0.29 — 2026-08-29

This document defines what happens when the user clicks, types, submits, cancels, fails, or is blocked. Do not invent behavior. Do not treat screens as isolated pages.

---

## How to read a flow

Every important action is specified as:

```
SOURCE → ACTION → CONDITION → TARGET → UI → SERVER → DB → EXTERNAL → SUCCESS → ERROR
```

If a field is `—`, that layer does not run.

---

## 0. Two financial systems (never mix)

| | System A — Puyer subscriptions | System B — Invoice payments |
|---|---|---|
| Customer | Puyer user | User's customer |
| Merchant | Puyer | User's connected Stripe account |
| Stripe account | Platform | Connected account |
| Puyer revenue | Pro / Business | **$0** |
| Charge type | Stripe Billing on platform | **Direct charge** on connected account |

Forbidden on System B: `application_fee_amount`, destination charges, separate charges and transfers, platform capture, Puyer holding funds.

---

## 1. Global navigation

### Public header (unauthenticated)

| Object | Action | Target |
|---|---|---|
| Logo `Puyer` | click | `/` (scroll top). If builder dirty → unsaved modal first |
| Features | click | `/#features` (smooth scroll if already on `/`). Cards loop horizontally; hover pauses. |
| Templates | click | `/#templates` |
| Pricing | click | `/pricing` |
| FAQ | click | `/#faq` |
| Login | click | `/login` |
| Create Invoice | click | Unauth: scroll to `#builder`, focus first input. Auth: `/invoices/new` |
| Theme toggle | — | Not on landing, `/pricing`, `/login`, or the dashboard. Those stay light. Public `/invoice/[publicId]` may still follow stored `puyer-theme`. |

Mobile public header: Logo + Create Invoice + Menu. Menu opens sheet with the remaining links.

Footer (marketing): Features, Pricing, Templates, Contact, Privacy, Terms, Cookie Policy, Cookie settings.

### Cookie window

```
Any page (first visit, no puyer-cookie-consent)
→ UI: floating card (not a full-page wall)
→ Accept all | Reject optional | Customize
→ TARGET: localStorage puyer-cookie-consent
→ Necessary cookies always run (Auth, return path)
→ Analytics/marketing scripts only if those flags are true (none shipped in v1)
```

Footer Cookie settings or `/cookies` button → reopen Customize.

`/privacy` `/terms` `/cookies` → legal articles. Login form links Terms and Privacy under Continue with email.

### Authenticated app

Sidebar (desktop): Home, Clients, Invoices, Payments, Reports. Footer: Settings, Team, Notifications. Icons are Phosphor duotone (gear for Settings, bell for Notifications).

Mobile bottom: Home, Clients, Invoices, Payments, More.

More sheet: Reports, Settings, Team, Billing, Notifications, Sign out.

Logo (auth) → `/dashboard` (unsaved modal if builder dirty).

Sign out (sidebar, More sheet, Settings, error boundary) → `POST /api/auth/signout` (clears Auth cookies) → `/login`.

### Universal nav rules

1. Persist only data that is already saved.
2. Navigate → scroll to top (except in-page hash on `/`).
3. Unauthenticated builder: **do not save drafts**.
4. If builder is dirty and destination leaves builder: modal **Leave without saving?**
   - Continue editing → close modal, stay
   - Leave without saving → discard in-memory state, navigate

---

## 2. Public landing `/`

```
Header → Hero → Invoice Builder → Marketing → Footer
```

### Hero / header Create Invoice (unauth)

```
Landing → click Create Invoice → unauthenticated
→ TARGET: #builder
→ UI: smooth scroll, focus #invoice-business-name
→ SERVER: —
→ Do NOT open login/register
```

### Hero / header Create Invoice (auth)

```
Landing → click Create Invoice → authenticated
→ TARGET: /invoices/new
→ UI: navigate, builder with Business Profile defaults
```

### Features / FAQ / Templates (on `/`)

In-page smooth scroll. **Use this template** → apply template on current builder (unauth) or `/invoices/new?template=` (if navigating away). Cards show live invoice previews; hover zooms the preview. Keep data. Do not register.

FAQ accordion answers live product questions (account vs guest builder, plans, PDF after sign-in, magic link, Stripe on Pro, fees, client pay, bank transfer, reminders, team, tax %, no recurring yet).

Pricing link in header → `/pricing`. In-page pricing section remains for marketing; header Pricing always goes to `/pricing`.

### Stripe (`#stripe`)

Phosphor flow: customer → Stripe → business. Required note: Puyer is invoicing software; payments go through the connected Stripe account. **Connect Stripe** is `OpenAuthButton` with `intent="login"` (same as other unauth login CTAs).

The dark `#trust` bar is display-only (Stripe / GDPR / data). Not a control.

The clients marketing block is image + title only (no button). Other marketing CTAs use a light hover; `prefers-reduced-motion` keeps color/border changes without lift.

---

## 3. Authentication (email magic link only)

### Login

```
Any public page → Login
→ TARGET: /login
→ UI: split page — email Sign in / Create account (magic link, no password) on the left; invoice payment illustration (`/auth/login-hero.png`) on the right. White canvas, no theme toggle.
→ SERVER: send magic link (rate limited)
→ SUCCESS: “Check your inbox” + Change email + Resend (cooldown)
→ ERROR: safe message, no stack traces
```

Header, pricing subscribe (unauth), and gated app routes all open `/login`. Download PDF / Share on the public builder still use the registration **modal** so builder context is not lost.

Cancel on `/login` is the Puyer logo → `/`.

### Magic link `/auth/confirm` (via `/auth/callback` or `/verify`)

```
Email → open link (GET does not consume token) → Continue to Puyer → session
→ Restore `authReturnTo` context (never stay on `/` after a successful login):

A login          → /dashboard
B download PDF   → builder + resume download
C share          → builder + open Share menu
D team invite    → invitation accept screen
```

Never lose context. Never persist unauthenticated drafts on the server.

---

## 4. Invoice builder (this phase: public `/`)

Unauthenticated. No DB row until an authenticated persist action.

Temporary number e.g. `INV-2026-001` is **preview only**. Server issues the real number on create.

### Field behavior

| Field | Click / change | Result |
|---|---|---|
| Invoice number | display | Read-only preview number until auth create |
| Currency | open searchable list | Closed control shows `USD ($)`. List: code · name + symbol. Click outside or Escape closes. Select code/name/symbol. Recalc display. If line items exist → warning modal Continue/Cancel |
| Business | type | Preview updates. Unauth: manual. Auth: prefill profile; “this invoice only” vs “save as default” |
| Client | type / select | Unauth: free text. Auth: searchable clients + Create new client modal |
| Add item | click | New row. Amount = qty × unit price (display). Totals + preview update |
| Qty / price / tax | input | Recalculate line, subtotal, discount, tax, total. Preview live |
| Discount type/value | change | Custom list (None / Percentage / Fixed). Closes on outside click, Escape, or choice. Recalculate. Inline error if invalid |
| Tax % | change | Recalculate tax + total |
| Bank transfer | type | Optional IBAN / account fields. Preview updates. Not saved unless the storage-consent checkbox is checked |
| Bank storage consent | checkbox | Required to send/store bank details. Unchecked: on-screen only; saved invoice/PDF omit them; no reuse on reload |
| Notes | type | Issuer notes only. A small Puyer platform disclaimer is always printed under Notes and cannot be edited or removed |
| Template icons | click | Keep data, switch visual only. All templates free. Same Figma invoice skeleton; Minimal = sparse paint; Professional = grey table + navy Total due; Premium = accent stripe + accent table header |
| Accent color | click | Preview color only |
| Zoom + / − | click | Session-only preview zoom, not browser zoom |
| Fullscreen | click | Desktop: modal. Mobile: full screen. Close returns to builder |

Every form change updates preview. No Save/Refresh required.

On the public landing only, the editor is two steps so the form stays near preview height: **Invoice details** then **Payment & notes**. Step 1 shows **Next** only. **Download PDF** and **Share** appear on step 2. `/invoices/new` and invoice edit keep one scrolling form. Invalid Download/Share jumps back to step 1. The preview pane still scrolls; the scrollbar is hidden.

### Mobile builder

Tabs: **Edit** | **Preview**. Switching does not reload. Download/Share appear after **Next** (step 2) on the landing builder.

### Validation (before download/share)

Required: business name, client name, valid dates, ≥1 line with description and qty>0 and unit price≥0. Unused empty extra lines are ignored. Inline errors with a red border. Do not open auth/share until valid. **Save invoice** uses the same validation before POST/PUT.

### Download PDF — unauthenticated

```
Builder → Download PDF → invalid? inline errors, stay
→ valid? “Preparing your invoice…” then “Your invoice is ready”
→ Registration modal with Figma header illustration
→ Copy: register or log in to download/share
→ Register (primary) or Log in (same email magic link)
→ Magic link → return to SAME builder state (memory)
→ User clicks Download PDF again
→ persist invoice (auth) → generate PDF → download → toast “Invoice downloaded”
```

Unauthenticated: **never** persist. **never** download a stored invoice.

### Download PDF — authenticated

Validate → server recalc → create/save → PDF → download → toast.

### Share — unauthenticated

Validate → registration modal (not share menu). After auth, return to builder and **open Share menu**.

### Share — authenticated

Menu: Email, Copy link, WhatsApp, Native Share, More.

Copy link: persist if needed, public unguessable id, clipboard, toast.

Email: modal recipient/subject/message → send → status SENT → toast.

WhatsApp / native: public URL. No Puyer backend send. Fallback: copy link.

### Leave builder

Dirty + navigate away → Leave without saving? Discard is in-memory only.

Refresh unauth builder: **state is lost** (intentional).

---

## 5. Modals vs drawers vs toasts

**Modals:** confirm, auth, small forms, upgrade, destructive.

**Drawers (desktop right / mobile sheet):** invoice, client, payment, notifications. Underlying list stays.

**Toasts:** create, update, delete, copy, send, connect, disconnect.

Double-click: disable primary button while in-flight. Especially Pay, Download, Send, Subscribe, Connect Stripe.

---

## 6. Pricing & Puyer billing (System A)

`/pricing` and landing `#pricing` — Free / Pro / Business, Monthly/Yearly segmented control (no reload). Same Checkout contract.

| Plan CTA | Unauth | Auth |
|---|---|---|
| Free Get Started | `/` builder | `/invoices/new` |
| Pro / Business | Auth first (return to pricing) then **platform** Stripe Checkout | Platform Checkout |

Success URL `/billing/success` is UX only. Entitlements flip on **platform webhooks**.

Customer Portal = Puyer subscription only. Never connected-account invoice money.

---

## 7. Authenticated product

| Source | Action | Target |
|---|---|---|
| Dashboard Create Invoice | click | `/invoices/new` |
| Dashboard Add Client | click | modal: name, email, optional phone |
| Dashboard View Payments | click | `/payments` |
| Invoices row | click | **drawer**, optional `?invoice=` |
| Drawer Send reminder | click | Pro: edit body, email from reminders@puyer.org; Free: upgrade |
| Drawer Set status | change | allowed `STATUS_TRANSITIONS` only; Paid adds **Payment Received** on the timeline |
| Drawer Edit | click | `/invoices/:id/edit` |
| Clients row | click | **client drawer**, optional `?client=` |
| Client Create Invoice | click | `/invoices/new?client=` |
| Payments row | click | payment drawer; copy: paid through **connected Stripe**, not Puyer |
| Reports Business-only | click | upgrade modal (`/reports` advanced tables). Overview Revenue Trends is not gated. |
| Reminders as Free | click | upgrade to Pro modal |
| Team as Free/Pro | click | upgrade to Business modal |

Access denied / other tenant: generic **Page not found**.

---

## 8. Public invoice `/invoice/[publicId]` (System B)

Pay Invoice → connected-account Checkout (direct charge, no application fee). Webhook is source of truth. Success redirect is not PAID.

Public page: header with Puyer, invoice document card, and a payment sidebar (amount due, Pay Invoice, Download PDF). Colors use theme tokens so dark/light stay readable. Stripe trust line. If Stripe disconnected: “Online payment is currently unavailable.” Owner: Connect Stripe.

Refunds/disputes: display only; manage in Stripe.

---

## 9. Stripe Connect (System B settings)

Connect → hosted onboarding → return → **server** status (not redirect trust) → CONNECTED / ACTION_REQUIRED.

Disconnect: confirm, keep historical payments.

---

## 10. Implementation status

| Area | In this increment |
|---|---|
| UX contract (this file) | **Done** |
| Public header + theme + in-page nav | **Done** |
| Interactive public Invoice Builder + live preview | **Done** |
| Unsaved modal, auth/registration modals (UI) | **Done** |
| Magic link / Supabase session | **Done** (Phase 1) |
| Persist invoice + public `publicId` (no pay) | **Done** (Phase 2) |
| Real PDF + public download + rate limit | **Done** (Phase 3) |
| Dashboard Figma shell, Overview, Invoices drawer | **Done** (live invoice data) |
| Connect Stripe, public Pay, Payments list | **Done** (Phase 4) |
| Billing (Puyer subscriptions) | **Done** (Phase 5) |
| Reminders, email, notifications | **Done** (Phase 6) |
| Reports | **Done** (Phase 7) |
| Teams | **Done** (Phase 8) |

Magic link: Continue with email calls `POST /api/auth/otp`. After the link, login returns to `/dashboard`. Download/Share return to `/?resume=download|share` (click again; unauth drafts are not persisted). `/invoices/new` persists via `POST /api/invoices`. Overview and Invoices KPIs use saved invoices.

---

## Changelog

```
[2026-08-27] – Added: Complete interaction contract for Puyer.
[2026-08-27] – Added: Public header + working landing Invoice Builder implemented against this file.
[2026-08-27] – Changed: Theme toggle is a moon/sun icon; dark theme covers the full public UI including invoice preview.
[2026-08-28] – Changed: Magic link is live (`POST /api/auth/otp` + `/auth/callback`). Dashboard is a signed-in placeholder until the Figma app shell.
[2026-08-28] – Changed: Authenticated Overview + Invoices drawer implemented from Figma; remaining domain screens are stubs.
[2026-08-28] – Changed: Invoice persist, public `/invoice/[publicId]`, and live dashboard KPIs (Phase 2).
[2026-08-28] – Changed: Authenticated and public PDF download (Phase 3).
[2026-08-28] – Changed: Stripe Connect, public Pay, Payments list (Phase 4).
[2026-08-28] – Changed: Platform subscriptions, entitlements, Billing + pricing Checkout (Phase 5).
[2026-08-28] – Changed: Automatic reminders, Resend, in-app notifications (Phase 6).
[2026-08-28] – Changed: Reports (base KPIs + Business analytics) (Phase 7).
[2026-08-28] – Changed: Team invites and roles (Phase 8).
[2026-08-28] – Changed: Public `/invoice/[publicId]` payer layout (document + pay sidebar).
[2026-08-28] – Fixed: Save/download highlight invalid fields; empty extra line items are ignored.
[2026-08-28] – Fixed: Public payer portal uses theme tokens (no dark cards with light-theme ink).
[2026-08-28] – Changed: Header Login opens `/login` (split magic-link page). Download/Share stay modal.
[2026-08-28] – Added: Sign out in the app shell (sidebar + More). Settings no longer 500s if Connect lookup fails.
[2026-08-28] – Changed: `/login` right panel uses the invoice payment illustration PNG.
[2026-08-29] – Changed: `/login` uses a white canvas and does not show the theme toggle.
[2026-08-29] – Changed: Landing `#templates` cards show live invoice previews.
[2026-08-29] – Fixed: Template invoice previews stay aligned in the card (scale from top-left).
[2026-08-29] – Added: Hovering a template card zooms the invoice preview.
[2026-08-29] – Changed: Minimal / Professional / Premium invoice layouts are distinct.
[2026-08-29] – Added: Notes always includes a small non-editable Puyer platform disclaimer.
[2026-08-29] – Added: Bank transfer details require a storage-consent checkbox before they are saved.
[2026-08-29] – Changed: Landing builder fills invoice data in two steps (details, then payment).
[2026-08-29] – Changed: Landing step 1 is Next only; Download PDF and Share appear on step 2. Preview scrollbar is hidden.
[2026-08-29] – Changed: Landing and `/pricing` stay light; no header theme toggle.
[2026-08-29] – Changed: Invoice templates share one Figma document skeleton.
[2026-08-29] – Changed: Invoice preview has no Terms & conditions column; bank details use full width.
[2026-08-29] – Fixed: After magic link, login returns to `/dashboard` even if Auth landed on Site URL (`/`).
[2026-08-29] – Changed: Landing Features is a horizontal marquee with Phosphor icons.
[2026-08-29] – Changed: Landing Why list is dual Phosphor chip marquees.
[2026-08-29] – Changed: Authenticated dashboard is light forest-green; invoice row still opens a right preview drawer.
[2026-08-29] – Changed: Landing How steps use Phosphor badges, a connector line, and screenshot hover zoom.
[2026-08-29] – Changed: Landing `#stripe` uses Phosphor flow icons; Connect Stripe still opens login.
[2026-08-29] – Changed: Landing clients block has no button; remaining marketing CTAs have a light hover.
[2026-08-29] – Added: Cookie choice window; footer links to Privacy, Terms, Cookie Policy.
[2026-08-29] – Changed: Pricing is Phosphor plan cards with a Monthly/Yearly segmented control.
[2026-08-29] – Changed: Landing trust bar is Phosphor chips (not clickable); copy unchanged.
[2026-08-29] – Changed: Landing FAQ covers live product questions (no guest PDF download).
[2026-08-29] – Changed: Dashboard sidebar and mobile tabs use Phosphor nav icons.
[2026-08-29] – Added: Add Client collects email and phone; invoice timeline rail no longer slides status labels.
[2026-08-29] – Fixed: Magic-link GET no longer consumes the one-time token; user confirms on `/auth/confirm`.
[2026-08-29] – Added: Table Editor can set Organization plan type (`plan`) and billing status (`planSource=MANUAL`).
[2026-08-29] – Changed: Overview/Reports trend chart fills the card; Paid invoices show Payment Received on the timeline.
[2026-08-29] – Added: Invoice drawer manual reminder (editable) and status change; animated timeline.
[2026-08-29] – Changed: Dashboard KPI sparks fade without a stroke; long names stay inside the rail and drawers.
[2026-08-29] – Added: Clients list row opens a right drawer (`?client=`).
[2026-08-29] – Changed: Overview Revenue Trends is on every plan; Insights stay Business.
```
