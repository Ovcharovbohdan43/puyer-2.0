# Puyer — Complete User Flow & Interaction System

> **Status:** Canonical interaction contract.  
> **Follow with:** [`PLAN.md`](../PLAN.md) (architecture, Stripe separation, data).  
> **If UI and this file disagree, update this file first.**  
> **Version:** 1.0.4 — 2026-08-28

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
| Features | click | `/#features` (smooth scroll if already on `/`) |
| Templates | click | `/#templates` |
| Pricing | click | `/pricing` |
| FAQ | click | `/#faq` |
| Login | click | **Auth modal** (does not navigate) |
| Create Invoice | click | Unauth: scroll to `#builder`, focus first input. Auth: `/invoices/new` |
| Theme toggle | click | Moon/sun icon. Toggle light/dark. Persist `localStorage`. Public default: light. Preview and chrome follow the theme. |

Mobile public header: Logo + Create Invoice + Menu. Menu opens sheet with the remaining links.

### Authenticated app

Sidebar (desktop, collapsible): Overview, Invoices, Clients, Payments, Reports, Settings.

Mobile bottom: Overview, Invoices, Clients, Payments, More.

More sheet: Reports, Settings, Team, Billing, Notifications.

Logo (auth) → `/dashboard` (unsaved modal if builder dirty).

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

In-page smooth scroll. **Use this template** → apply template on current builder (unauth) or `/invoices/new?template=` (if navigating away). Keep data. Do not register.

Pricing link in header → `/pricing`. In-page pricing section remains for marketing; header Pricing always goes to `/pricing`.

---

## 3. Authentication (email magic link only)

### Login

```
Any public page → Login
→ TARGET: Auth modal “Sign in to Puyer”
→ UI: email input, Continue with email (disabled while submitting)
→ SERVER: send magic link (rate limited)
→ SUCCESS: “Check your inbox” + Change email + Resend (cooldown)
→ ERROR: safe message, no stack traces
```

Cancel / overlay / Escape → close modal, stay on page.

### Magic link `/auth/callback` (or `/auth/verify`)

```
Email → click link → validate token → session
→ Restore `authReturnTo` context:

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
| Template icons | click | Keep data, switch visual only. All templates free |
| Accent color | click | Preview color only |
| Zoom + / − | click | Session-only preview zoom, not browser zoom |
| Fullscreen | click | Desktop: modal. Mobile: full screen. Close returns to builder |

Every form change updates preview. No Save/Refresh required.

### Mobile builder

Tabs: **Edit** | **Preview**. Switching does not reload. Download/Share stay visible.

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

`/pricing` — Free / Pro / Business, monthly/yearly toggle (no reload).

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
| Dashboard Add Client | click | client modal; stay on dashboard |
| Dashboard View Payments | click | `/payments` |
| Invoices row | click | **drawer**, optional `?invoice=` |
| Drawer Edit | click | `/invoices/:id/edit` |
| Clients row | click | client drawer |
| Client Create Invoice | click | `/invoices/new?client=` |
| Payments row | click | payment drawer; copy: paid through **connected Stripe**, not Puyer |
| Reports Business-only | click | upgrade modal |
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
```
