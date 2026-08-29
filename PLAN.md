# Puyer.org — Master Architecture & Implementation Plan

> **Status:** Canonical. All subsequent implementation MUST follow this document.  
> **If a change contradicts this plan, update this file first, then the code.**  
> **Version:** 1.4.12  
> **Date:** 2026-08-29  
> **Repository state at planning:** empty (greenfield). No existing infrastructure to preserve.

---

## How to use this document

0. Before writing library/API code, query **Context7 MCP** for the current docs of that library. If Context7 contradicts this plan, update this plan first — do not silently follow stale text.
1. Read **Non-negotiables** before writing any Stripe or money code.
2. Read **[`docs/UX_FLOWS.md`](./docs/UX_FLOWS.md)** before implementing clicks, navigation, modals, or payment UI. Do not invent interaction behavior.
3. Implement **in the phase order** in §19. Do not skip phases.
4. After each phase: typecheck, lint, tests for that phase, then update the changelog at the bottom.
5. Before considering Stripe complete, run the checklist in §17.

This is not a prototype plan. Design as if Puyer will serve thousands now and millions later.

---

## 1. Product

Puyer is invoicing software for freelancers, self-employed professionals, and small businesses.

Users can:

- create invoices
- manage clients and products/services
- generate PDFs
- share invoices via unguessable public links
- track invoice/payment status
- connect their own Stripe account
- receive payments **directly** on that connected Stripe account
- configure automatic reminders (Pro)
- view reports
- ask for help from `/help`
- subscribe to **Puyer Pro** or **Puyer Business**

### Monetization (only)

| Product | Revenue |
|---|---|
| Puyer Pro | Stripe Billing subscription |
| Puyer Business | Stripe Billing subscription |

Puyer **MUST NOT**:

- charge application fees on invoice payments
- take a percentage of invoice payments
- receive, hold, or transfer customer invoice funds
- create destination charges
- create separate charges and transfers
- act as merchant of record for users' invoices

**Copy (required, not legal conclusions):**

- “Puyer is invoicing software. Payments are processed directly through your connected Stripe account.”
- “Puyer does not hold your customers' funds or charge transaction fees.”

Do **not** hard-code claims like “Puyer is never legally responsible for anything.”

Every issued invoice (preview, PDF, public page) prints a small Notes disclaimer: created with Puyer; Puyer is software only and does not control how users apply it; the issuer is responsible for the document. That is product copy, not a legal conclusion. It is separate from the optional “Made with Puyer” footer.

---

## 2. Non-negotiables (stop and reconsider)

If any decision would cause Puyer to:

- receive user invoice money
- become merchant of record for user invoices
- pay Stripe processing fees for users' invoice payments
- assume connected-account negative balances
- handle refunds or chargebacks on behalf of users
- charge `application_fee_amount`
- use destination charges
- use separate charges and transfers

**STOP.** Re-read this section. Change the design.

Intended model:

```
Puyer          = SaaS invoicing software
User           = business / merchant
Connected acct = merchant of record
Stripe         = payment processor
Puyer revenue  = Pro + Business subscriptions only
```

The **code** must enforce this. Documentation is not enough.

---

## 3. Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| App | **Next.js 16** (App Router) + TypeScript `strict` | Current stable in Context7 (`/vercel/next.js` v16.2.9). Server-first, Vercel-native |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible, consistent tokens, dark/light |
| DB | **Supabase Postgres** | User-mandated. Managed Postgres, Auth, Storage, RLS, backups |
| ORM | Prisma | Migrations, relations, type-safe queries, transaction APIs |
| Auth | Supabase Auth + `@supabase/ssr`, **email magic link only** (`signInWithOtp`) | Spec: email-first, no passwords. Current SSR clients, not legacy auth helpers |
| Files | Supabase Storage | Logos + generated PDFs. Signed URLs. No files in Postgres |
| Jobs | **Inngest** | Durable, idempotent, retries, cron, works on Vercel without a second runtime |
| Rate limit / cache | Upstash Redis | Serverless-native, used for rate limits and short-lived locks |
| Email | Resend behind `EmailService` | Transactional; provider is swappable |
| PDF | `@react-pdf/renderer` | Server-side, no Chromium, fits serverless timeouts |
| Money | `bigint` minor units + ISO 4217 | No JS floating point for money |
| i18n | `next-intl` | English first, architecture ready for more locales |
| Payments | Official `stripe` Node SDK | No fake Stripe. Pin API version |
| Tests | Vitest (unit/integration) + Playwright (e2e) | Required coverage listed in §16 |
| Hosting | **Vercel** (app) + **Supabase** (data plane) + **Inngest Cloud** (orchestration) | See §4 |

**Not in v1:** passwords, OAuth social login (may add later), destination charges, marketplace features, platform refunds, microservices.

### Context7 (mandatory)

Context7 MCP is **enabled** and is the first source for library/API truth during implementation.

**Protocol:**

1. `resolve-library-id` → then `query-docs` for the exact topic.
2. Prefer official docs libraries (High reputation) over random boilerplates.
3. If Context7 contradicts this plan: **update this plan**, then implement. Never copy a docs snippet that violates Non-negotiables.
4. Stripe docs examples often include `application_fee_amount` and `configuration.recipient` / `stripe_transfers`. Those are **templates**. Copying them into Puyer is a defect.

**Canonical Context7 library IDs for this repo:**

| Topic | Library ID |
|---|---|
| Stripe platform docs | `/websites/stripe` |
| Stripe Node SDK | `/stripe/stripe-node` |
| Next.js | `/vercel/next.js` (pin current stable, presently v16.2.9) |
| Next.js docs site | `/websites/nextjs` |
| Supabase | `/supabase/supabase` |
| Supabase SSR | `/supabase/ssr` |
| Prisma | resolve at implementation (`Prisma`) |
| Inngest | resolve at implementation (`Inngest`) |
| next-intl / Resend / Upstash | resolve at implementation |

Re-query Stripe Connect at **Phase 4** start. Stripe Connect v2 is still evolving.

---

## 4. Deployment decision: Vercel, not Railway

### Decision

**Primary production topology:**

```
Users / invoice payers
        │
        ▼
   Vercel (Next.js)
   - marketing site
   - dashboard
   - public invoice pages  ← global edge, low latency
   - API / server actions
   - Stripe webhook receivers
   - Inngest serve endpoint
        │
        ├──────────► Supabase
        │              - Postgres (source of truth)
        │              - Auth (magic links)
        │              - Storage (logos, PDFs)
        │              - RLS (defense in depth)
        │
        ├──────────► Inngest Cloud
        │              - reminders
        │              - emails
        │              - PDF jobs
        │              - report snapshots
        │              - notification fan-out
        │
        ├──────────► Upstash Redis
        │              - rate limits
        │              - idempotency locks
        │
        ├──────────► Resend
        │
        └──────────► Stripe
                       - platform account: Puyer subscriptions only
                       - connected accounts: invoice payments only
```

**Railway is not the primary host.**

### Why Vercel over Railway for this product

Puyer is a **Next.js SaaS** whose hottest public path is `/invoice/[publicId]` (customers paying invoices worldwide). That path needs:

- global CDN / edge
- instant scale on traffic spikes (end-of-month invoicing)
- first-class Next.js, preview deploys, ISR

The data plane is **already Supabase**, so Railway Postgres would be a second database we do not want.

Background jobs (reminders, email, PDF) are **not** a reason to put the whole app on Railway. Inngest runs durable jobs by invoking Vercel functions step-by-step, with retries and cron. Each step stays within serverless timeouts.

### Why not “Railway-only”

| Need | Railway | Vercel + Supabase + Inngest |
|---|---|---|
| Next.js public invoice pages, global | regional container | global edge |
| Postgres | extra DB we don't need | Supabase (chosen) |
| Auth magic links | DIY | Supabase Auth |
| Object storage | extra service | Supabase Storage |
| Stripe webhooks | fine | fine (short-lived) |
| Reminders / email | native workers | Inngest (durable) |
| Scale to 10k → 1M users | vertical + more containers | serverless auto-scale |
| Preview deploys | weaker | first-class |

### Scale path (do not overbuild now)

| Stage | Users | Topology |
|---|---|---|
| Launch | hundreds | Vercel Pro + Supabase Pro + Inngest + Upstash |
| Growth | thousands | connection pooling (Supavisor), read replicas if needed, Inngest concurrency limits |
| Large | hundreds of thousands | dedicated Supabase compute, Prisma accelerate or PgBouncer, CDN for PDFs, optional **Railway/Fly worker** only if Chromium PDF is required |
| Very large | millions | extract report aggregation and PDF to a worker service; keep Next.js on Vercel; never mix Stripe domains |

**Optional later (not v1):** a Railway/Fly worker **only** for Chromium-based PDF if `@react-pdf/renderer` visual parity is insufficient. That worker must not own Stripe or billing.

### Vercel constraints we design around

- No long-running process in a single request. Jobs go through Inngest.
- Serverless DB connections: Prisma + Supabase **transaction pooler (port 6543)** at runtime; **direct (5432)** for migrations. Prisma Client always sets `pgbouncer=true` and `statement_cache_size=0` so Vercel env missing those flags does not throw Postgres `42P05`.
- PDF must not require full Chrome in v1.
- Webhooks must return 2xx quickly; heavy work is enqueued to Inngest after signature verification + idempotent insert.

---

## 5. Two Stripe domains (hard isolation)

Treat Stripe as **two products in one codebase**. Mixing them is a defect.

```
DOMAIN A — Puyer Billing          DOMAIN B — Invoice Payments
────────────────────────────────  ────────────────────────────────
Customer = Puyer user             Customer = user's customer
Merchant = Puyer                  Merchant of record = connected business
Stripe account = platform         Stripe account = connected account
Purpose = Pro / Business          Purpose = pay an invoice
Money to Puyer = subscription     Money to Puyer = $0
Code: lib/stripe/platform/        Code: lib/stripe/connect/
Webhook: /api/webhooks/stripe/platform
                                  Webhook: /api/webhooks/stripe/connect
Env: STRIPE_SECRET_KEY            Same platform secret + Stripe-Account header
     STRIPE_WEBHOOK_SECRET_PLATFORM
                                  STRIPE_WEBHOOK_SECRET_CONNECT
Client: stripePlatform            Client factory: connectStripe(accountId)
Never pass stripeAccount          Always pass stripeAccount
Never create invoice Checkout     Never create Puyer subscriptions
```

### Code enforcement (required)

1. **Two Stripe clients.** `stripePlatform` has no method that accepts `stripeAccount`. `getConnectClient(accountId)` **requires** a branded `ConnectedAccountId`.
2. **Two webhook routes** with **two signing secrets**. Do not share a handler that switches on `event.type` alone. `checkout.session.completed` exists in both domains.
3. **Forbidden APIs in connect layer:** `application_fee_amount`, Transfers, destination `transfer_data`, `on_behalf_of` for platform capture, refunds/payouts that move money.
4. **Type-level ban:** invoice Checkout params type **omits** `application_fee_amount` and `payment_intent_data.application_fee_amount`. Tests fail if those keys appear in the request payload.
5. **Separate DB tables:** `Subscription*` never stores connected-account payment IDs. `InvoicePayment*` never stores Puyer subscription IDs.

---

## 6. Stripe Connect (Domain B) — current API

Verified against Stripe docs (2026-08-28, Context7 `/websites/stripe` + `/stripe/stripe-node` v20, API `2026-02-25.clover`). Re-check if Stripe ships a new clover/preview pin.

### Charge type

**Direct charges only.**

```
Customer → Stripe Checkout (branded as connected business)
         → PaymentIntent / Charge lives ON the connected account
         → Funds settle to connected account balance
         → Puyer platform balance unchanged
```

Implementation: Checkout Session in `mode: "payment"` with header:

```
Stripe-Account: {{CONNECTED_ACCOUNT_ID}}
```

**Do not set** `payment_intent_data.application_fee_amount`.

Stripe docs show application fees as optional. For Puyer they are **forbidden**.

Direct charges are the SaaS-recommended model when connected accounts have **full Stripe Dashboard** access. Transaction objects exist on the connected account; retrieve them **only** with the connected account context.

### Connected account configuration (Accounts v2)

Do **not** hard-code legacy Standard/Express/Custom as the primary model. Use Accounts v2 controller/responsibility properties.

Create connected accounts via `stripe.v2.core.accounts.create` conceptually:

```ts
{
  contact_email: user.email,
  display_name: business.businessName,
  dashboard: "full",                    // business has Stripe Dashboard
  identity: {
    country: /* from onboarding */,
    entity_type: /* individual | company */,
  },
  configuration: {
    merchant: {
      capabilities: {
        card_payments: { requested: true },
        // stripe_balance.payouts as required by current docs
      },
    },
  },
  defaults: {
    currency: business.defaultCurrency,
    responsibilities: {
      fees_collector: "stripe",         // connected account / Stripe, NOT Puyer
      losses_collector: "stripe",       // Stripe, NOT Puyer
    },
  },
}
```

| Property | Value | Meaning for Puyer |
|---|---|---|
| `configuration.merchant` | requested | Account can accept customer payments |
| `dashboard` | `full` | Business owns Stripe relationship / Dashboard |
| `fees_collector` | `stripe` | Puyer does not pay processing fees |
| `losses_collector` | `stripe` | Puyer does not assume negative-balance liability |
| `recipient` / transfers | **do not enable** | We do not transfer invoice funds |
| `customer` config on connected acct | **do not use for Puyer subs** | Puyer subscriptions are Domain A |

`responsibilities` cannot be updated later. Get this right at create time.

**Context7 confirmation (2026-08-27, `/websites/stripe`):**

- Create path is `stripe.v2.core.accounts.create` (Node) / `client.V2.Core.Accounts.Create`.
- Official onboarding snippets list `dashboard: none | express | full` and `fees_collector` / `losses_collector` as `application | stripe`. Puyer locks **`full` + `stripe` + `stripe`**.
- Official snippets also request `configuration.recipient` + `stripe_transfers`. **Do not enable recipient/transfers** — that is a marketplace/Treasury template, not SaaS invoicing.
- Direct charge Checkout (Node) is the **two-argument** SDK form:

```ts
await stripe.checkout.sessions.create(
  {
    mode: "payment",
    line_items: [/* server-recalculated amount */],
    success_url,
    cancel_url,
    // NEVER payment_intent_data.application_fee_amount
  },
  { stripeAccount: connectedAccountId },
);
```

Official Stripe Checkout examples include `application_fee_amount: 123`. **Omit that field entirely.** Tests must fail if it appears.

If Stripe later requires a preview API version for `dashboard: "full"` + `losses_collector: "stripe"`, pin that version **only** in the Connect client and document it. Do not silently fall back to `losses_collector: "application"`.

### Onboarding

Stripe **does not recommend OAuth** for new Connect platforms.

**v1 flow:**

1. Settings → Payment Settings → Connect Stripe
2. Server creates Accounts v2 account (status `CONNECTING`)
3. Server creates Account Link: `stripe.v2.core.accountLinks.create` with `use_case.type = account_onboarding`, `configurations: ["merchant"]`, `return_url`, `refresh_url`
4. User completes Stripe-hosted onboarding
5. Return to Puyer
6. `account.updated` (Connect webhook) is source of truth for `CONNECTED` vs `ACTION_REQUIRED`

Persist:

- `stripeConnectedAccountId`
- `stripeConnectionStatus`: `NOT_CONNECTED | CONNECTING | CONNECTED | ACTION_REQUIRED | DISCONNECTED`

Do **not** store Stripe secret keys. Do **not** store connected-account keys (there are none to store).

### Payment flow (public invoice)

```
GET /invoice/:publicId
  → public, rate-limited, no internal IDs
Pay Invoice
  1. Validate invoice payable (not DRAFT/PAID/CANCELED, amount > 0)
  2. Validate Stripe connection == CONNECTED + charges enabled
  3. Recalculate totals server-side (never trust client)
  4. Create Checkout Session ON connected account (idempotency key)
  5. Redirect to Stripe Checkout (connected-account branding)
  6. Customer pays connected account
  7. Connect webhook verified
  8. InvoicePayment + Invoice status updated
```

Success page after redirect is **UX only**. Never mark PAID from the redirect.

### What Puyer must not implement (Domain B)

- Refunds API for invoice payments (business refunds in Stripe Dashboard)
- Dispute funds movement
- Payouts
- Application fees
- Platform-level customer objects for invoice payers (optional: customers on the **connected** account only, never on platform)

Puyer **may** display refund/dispute status from Connect webhooks.

---

## 7. Platform billing (Domain A)

Stripe Billing on the **platform** account.

Products (Stripe Dashboard / seed script, test mode first):

- Puyer Pro
- Puyer Business

Local subscription fields:

- `stripeCustomerId` (platform Customer, Puyer user)
- `stripeSubscriptionId`
- `stripePriceId`
- `subscriptionStatus`: `trialing | active | past_due | unpaid | canceled | incomplete | incomplete_expired`
- `currentPeriodStart`, `currentPeriodEnd`
- `cancelAtPeriodEnd`
- `Organization.plan` (`FREE` / `PRO` / `BUSINESS`), `Organization.planSource` (`STRIPE` | `MANUAL`), `Organization.subscriptionStatus`

Webhooks (platform endpoint) are the source of truth for `STRIPE` workspaces. Checkout success redirect is not. `MANUAL` Table Editor grants are not overwritten by webhooks.

Use Stripe Customer Portal for plan changes/cancel (`createCustomerPortalSession` lives in **platform** module only).

Idempotency keys on subscription Checkout creation: `sub_create:{organizationId}:{priceId}`.

---

## 8. Entitlements

Central service only. No scattered `if (plan === "pro")` in UI as the real check. UI may hide; **server must deny**.

```ts
// lib/entitlements/index.ts
can(org, "STRIPE_PAYMENTS")
can(org, "AUTOMATIC_REMINDERS")
can(org, "ADVANCED_PAYMENT_TRACKING")
can(org, "TEAM_MEMBERS")
can(org, "ADVANCED_REPORTS")
can(org, "FORECASTING")
can(org, "PERFORMANCE_INSIGHTS")
can(org, "TEAM_ANALYTICS")
can(org, "PREMIUM_TEMPLATE_UNBRANDED")
```

| Capability | Free | Pro | Business |
|---|---|---|---|
| Unlimited invoices | yes | yes | yes |
| Basic builder + 3 templates | yes | yes | yes |
| PDF, share, clients, products | yes | yes | yes |
| Basic tracking | yes | yes | yes |
| Subtle “Made with Puyer” on Free template | yes | — | — |
| Premium template without Puyer branding | all plans (spec: all templates free; Premium has no Puyer branding) | | |
| Stripe Connect + auto payment tracking | no | yes | yes |
| Smart automatic reminders | no | yes | yes |
| Teams, Owner + Member | no | no | yes |
| Advanced reports, forecasting, insights, team analytics | no | no | yes |

Free has **no invoice-count limit**.

Map Stripe status → effective plan:

- `active`, `trialing` → paid plan
- `past_due` → keep entitlements for a short grace window (document length, default 7 days), then lock premium
- `canceled`, `unpaid`, `incomplete_expired` → Free

---

## 9. Domain architecture (modular monolith)

Not microservices. Bounded contexts inside one Next.js app.

```
/app
  /(marketing)          # light-first public site
  /(auth)               # magic link
  /(dashboard)          # light-first app (forest green)
  /invoice/[publicId]   # public invoice + pay
  /api
    /webhooks/stripe/platform
    /webhooks/stripe/connect
    /inngest
    /cron               # only as Inngest fallback, not source of truth

/lib
  /auth                 # session, magic link helpers
  /db                   # Prisma client, tenant context
  /errors               # typed AppError hierarchy
  /entitlements
  /authorization        # requireInvoiceAccess, requireOrgAccess, ...
  /audit
  /observability        # structured logger, redaction
  /money                # minor units, tax, discount
  /i18n
  /rate-limit
  /storage              # Supabase Storage wrapper
  /email                # provider-agnostic
  /invoices
  /clients
  /products
  /payments             # InvoicePayment read-model sync (NOT Stripe SDK)
  /stripe
    /platform           # Domain A only
    /connect            # Domain B only
    /webhooks           # verify + route; no business logic
  /subscriptions
  /reminders
  /notifications
  /pdf
  /reports
  /teams
  /jobs                 # Inngest functions (call domain services)

/prisma
  schema.prisma
  migrations/

/messages
  en.json               # translation keys; no hardcoded UI strings

/tests
```

**Rules:**

- Stripe SDK is imported **only** under `/lib/stripe/**`.
- Payments domain talks to `StripeConnectService`, never to `stripe` directly.
- Subscriptions domain talks to `StripePlatformService` only.
- Client components: UI, form state, optimistic UX. No totals as source of truth, no Stripe secrets, no authorization.

---

## 10. Multi-tenancy and identity

### Tenant root: Organization

Spec lists `User` + `Team` + `TeamMember`. For scale and Business-plan teams, the tenant is an **Organization** (workspace). `Team` in the spec maps to Organization.

```
User 1 ──┐
User 2 ──┼── OrganizationMember(role) ── Organization ── BusinessProfile
User 3 ──┘                                    │
                                              ├── Clients, Products
                                              ├── Invoices, Payments (read model)
                                              ├── StripeConnection (0..1)
                                              ├── Subscription (0..1)
                                              └── ReminderRules, Reports
```

- **Free / Pro:** one Organization, user is `OWNER`.
- **Business:** multiple `MEMBER`s.
- All tenant data is scoped by `organizationId`. Never `Invoice.findUnique(id)` without org/membership check.

### Auth

Supabase Auth owns credentials/sessions (do **not** duplicate Account/Session tables unless we later leave Supabase Auth).

`public.User` is the app profile, PK = `auth.users.id`.

Sync: DB trigger on `auth.users` insert → create `User` + default `Organization` + `OrganizationMember(OWNER)` + `BusinessProfile` + `NotificationPreference`. If that insert already happened without a workspace (signup before the trigger, or a missed fire), `requireOrganization` calls `ensureWorkspace` and creates the same rows once (React `cache()` per request; unique races re-read membership). Signed-in users without a workspace are not a 404 — 404 is only for cross-tenant lookups.

Magic link only. Rate-limit send endpoint.

### Authorization helpers (server-only)

```
requireSession()
requireOrganization(user)
requireOrgRole(user, orgId, ["OWNER" | "MEMBER"])
requireInvoiceAccess(user, invoiceId)
requireClientAccess(user, clientId)
requireProductAccess(user, productId)
requireBusinessAccess(user, orgId)
requireEntitlement(org, capability)
```

OWNER: full access.  
MEMBER: CRUD on invoices/clients/products; cannot manage billing, Stripe connection, destroy org, or change roles (v1). Refine with a permission matrix in code, not in the client.

Roles from the DB only. Never trust `role` from the request body.

### RLS

Enable RLS on all tenant tables. Policies: `organization_id IN (select org ids for auth.uid())`.

Prisma uses the **service role / bypass** connection for server operations **and** still applies application-level `require*Access`. RLS is defense in depth for any future Supabase client usage and SQL accidents.

Never expose the service role key to the browser.

---

## 11. Database model

PostgreSQL via Prisma migrations. **Never** change production schema by hand.

### Conventions

- UUID PKs (`uuid` / `gen_random_uuid()`)
- `createdAt` / `updatedAt` on all tables
- Monetary columns: `BIGINT` minor units + `CHAR(3)` ISO 4217
- Percent/tax: `DECIMAL(7,4)` (e.g. 20.0000 = 20%)
- Public IDs: `CHAR`/`TEXT` cryptographically random, unique, **not** sequential
- Soft-delete only where legally useful (invoices: prefer status `CANCELED`; do not hard-delete paid invoices)
- Indexes: `organizationId`, foreign keys, status+dueDate, Stripe IDs (unique), webhook `eventId` (unique)

### Enums

```
InvoiceStatus:     DRAFT READY SENT VIEWED PARTIALLY_PAID PAID OVERDUE CANCELED
InvoicePaymentStatus: PENDING SUCCEEDED FAILED REFUNDED PARTIALLY_REFUNDED DISPUTED
StripeConnectionStatus: NOT_CONNECTED CONNECTING CONNECTED ACTION_REQUIRED DISCONNECTED
SubscriptionStatus: trialing active past_due unpaid canceled incomplete incomplete_expired
Plan:              FREE PRO BUSINESS
OrgRole:           OWNER MEMBER
DiscountType:      NONE PERCENT FIXED
ReminderType:      BEFORE_DUE ON_DUE AFTER_DUE
ReminderStatus:    SCHEDULED SENT SKIPPED FAILED
WebhookEventStatus: RECEIVED PROCESSED FAILED IGNORED
NotificationType:  invoice payment reminder system subscription
AuditAction:       (see §14)
```

### Tables (minimum)

| Table | Purpose |
|---|---|
| **User** | Profile: email, name, avatarUrl, locale, timezone, theme |
| **Organization** | Tenant |
| **OrganizationMember** | userId, organizationId, role, unique(user, org) |
| **OrganizationInvite** | pending/accepted/revoked email invite; token stored hashed |
| **BusinessProfile** | One per org. Defaults for new invoices |
| **Client** | organizationId (owner). name, email, address, taxNumber, phone, notes |
| **Product** | organizationId. name, description, defaultPriceMinor, defaultTaxRate, currency |
| **Invoice** | organizationId, clientId, publicId, invoiceNumber, status, dates, money fields, template, etc. |
| **InvoiceItem** | invoiceId, productId nullable, description, qty, unitPriceMinor, taxRate, amountMinor, sortOrder |
| **InvoiceSequence** | organizationId PK, nextNumber INT — **DB-safe numbering** |
| **InvoiceTemplate** | catalog: MINIMAL PROFESSIONAL PREMIUM (can be enum on Invoice if no custom templates in v1) |
| **InvoicePayment** | **read model** of connected-account payments. Never means Puyer holds funds |
| **PaymentEvent** | append-only Stripe payment event log (connect domain) |
| **StripeConnection** | organizationId unique, stripeConnectedAccountId, status, chargesEnabled, payoutsEnabled, detailsSubmitted, lastAccountUpdatedAt |
| **Subscription** | organizationId unique. Domain A only |
| **SubscriptionEvent** | append-only platform billing events |
| **WebhookEvent** | Stripe eventId unique, type, stripeAccountId nullable, domain `PLATFORM\|CONNECT`, payloadHash, status, error, processedAt |
| **ReminderRule** | org-level defaults + later per-invoice overrides |
| **ReminderEvent** | invoiceId, type, scheduledAt, sentAt, status, providerMessageId |
| **Notification** | userId, type, title, message, readAt |
| **NotificationPreference** | userId + orgId, email/in-app toggles |
| **ReportSnapshot** | orgId, period, JSON metrics (job-produced) |
| **AuditLog** | actorUserId, orgId, action, entityType, entityId, metadata JSON (no secrets) |
| **IdempotencyKey** | key, orgId, operation, responseHash, createdAt (optional if using Upstash) |

### Invoice numbering

Do **not** `COUNT(*)+1` in app memory.

```sql
-- inside a transaction
SELECT next_number FROM invoice_sequences WHERE organization_id = $org FOR UPDATE;
UPDATE invoice_sequences SET next_number = next_number + 1 ...;
-- format INV-0001 with zero-pad; never reuse numbers
```

Unique constraint: `(organizationId, invoiceNumber)`.

### Invoice public sharing

`Invoice.publicId` = cryptographically random (e.g. 21+ chars, `crypto.randomBytes` / nanoid with custom alphabet). Unique index. Rate-limit lookups. No sequential IDs in URLs.

### InvoicePayment is a synchronization/read model

Columns:

- invoiceId, organizationId
- stripeConnectedAccountId
- stripePaymentIntentId nullable
- stripeCheckoutSessionId nullable
- amountMinor, currency, status, paidAt

Puyer is **not** the owner of the funds.

### Spec mapping notes

- Spec `Account` / `Session`: provided by **Supabase Auth**, not duplicated.
- Spec `Team` / `TeamMember`: **Organization** / **OrganizationMember**.
- Spec `ownerId`: store as `organizationId` + createdByUserId where useful.

---

## 12. Financial calculations

Never trust client: subtotal, discount, tax, total.

Server recalculates before save, PDF, share, and payment session.

Use `bigint` minor units. Library: small internal `Money` helper (not `number`). Currency exponents from a static ISO 4217 table (JPY 0, USD 2, KWD 3).

Deterministic order (document in code and tests):

1. Line amount = round(qty × unitPrice) per line (define rounding: half-up to currency exponent)
2. Subtotal = sum(line amounts)
3. Discount: percent of subtotal **or** fixed minor units, cap at subtotal
4. Tax: apply `taxRate` to (subtotal − discount) unless later we add per-line tax-inclusive mode (v1: invoice-level tax + optional per-line tax that must still recompute)
5. Total = subtotal − discount + tax

Store computed fields on Invoice. If items change, recompute in the same transaction.

---

## 13. Module contracts (conceptual)

### StripeConnectService (`lib/stripe/connect`)

```
createConnectedAccount(org)
createOnboardingLink(org)          // Account Links v2, merchant
getConnectionStatus(accountId)     // retrieve with include requirements
createInvoiceCheckout(params)      // REQUIRES ConnectedAccountId; FORBIDS application fees
retrievePayment(accountId, id)
retrievePaymentIntent(accountId, id)
retrieveCheckoutSession(accountId, id)
disconnectAccount(org)             // local status; follow current Stripe disconnect docs
```

No `createRefund`. No `createTransfer`. No `createApplicationFee`.

### StripePlatformService (`lib/stripe/platform`)

```
createCustomer(org)
createSubscriptionCheckout(org, priceId)
createCustomerPortalSession(org)
retrieveSubscription(id)
```

No `stripeAccount` header. No invoice payment methods.

### Webhooks

1. Read **raw** body in the App Router route handler. Current Next.js Stripe example (`/vercel/next.js`): `await (await req.blob()).text()` plus `stripe-signature`. Do not `req.json()` before verification.
2. Route handlers are thin adapters. Domain logic lives in `lib/stripe/**`, not in the route file.
3. `constructEvent` with the **matching** secret (platform vs connect).
4. Insert `WebhookEvent` by `eventId` (unique). If conflict → return 200 (already processed or in flight).
5. Enqueue Inngest job `stripe/webhook.process` with event id.
6. Return 200 quickly.
7. Worker: load event, switch on **domain + type**, run idempotent handler, mark PROCESSED/FAILED.

Connect handlers (examples):

- `checkout.session.completed` → attach session/PI ids, still wait for PI succeeded for PAID if needed
- `payment_intent.succeeded` → InvoicePayment SUCCEEDED, Invoice PAID / PARTIALLY_PAID
- `payment_intent.payment_failed` → FAILED (invoice stays SENT/OVERDUE)
- `charge.refunded` → REFUNDED / PARTIALLY_REFUNDED; invoice status accordingly
- `charge.dispute.created` → DISPUTED
- `account.updated` → StripeConnection status
- `checkout.session.async_payment_succeeded` / `async_payment_failed`

Platform handlers:

- `customer.subscription.created|updated|deleted`
- `invoice.paid` / `invoice.payment_failed` (**Stripe Billing invoice**, not Puyer Invoice)
- `checkout.session.completed` only if session `mode=subscription` and **no** `event.account`

**Routing rule:** if `event.account` is present → Connect domain. If absent → Platform domain. Still keep separate endpoints so a mis-subscribed webhook cannot cross.

### EmailService

```
sendMagicLink()        // may be delegated to Supabase Auth email
sendInvoice()
sendPaymentConfirmation()
sendReminder()
sendSubscriptionNotification()
```

### PDF

Server-side only. Templates: Minimal, Professional, Premium. A4 and US Letter. Locale-aware dates/numbers. Embed Noto Sans (not Helvetica) so Cyrillic and other Noto-covered scripts render. Hash includes a layout version so renderer/font changes bust the Storage cache.

Free template: subtle “Made with Puyer”. Premium: no Puyer branding.

Store generated PDF in Supabase Storage; signed URL for download. Regenerate on invoice change (version or hash).

### Reminders (Pro)

Inngest cron (every 15 minutes) evaluates due invoices for **automatic** BEFORE_DUE / ON_DUE / AFTER_DUE.

Do not send for `PAID`, `CANCELED`, or `DRAFT`.

Types: before due, on due, after due, plus issuer **MANUAL** from the invoice drawer. Record every attempt in `ReminderEvent`. Automatic idempotency: unique `(invoiceId, type, scheduledDate)`. Manual: one send per invoice per UTC day.

Automatic reminders never schedule from an HTTP request lifecycle alone. Issuer-initiated MANUAL send is a signed-in API call (same pattern as invoice Send) and emails from `reminders@puyer.org`. The issuer may edit the body; HTML is escaped.

---

## 14. Security, privacy, observability

### Secrets

Server env only. Never in DB, logs, analytics, React, or client bundles except publishable keys.

| Key | Client? |
|---|---|
| `STRIPE_SECRET_KEY` | no |
| `STRIPE_WEBHOOK_SECRET_PLATFORM` | no |
| `STRIPE_WEBHOOK_SECRET_CONNECT` | no |
| `SUPABASE_SERVICE_ROLE_KEY` | no |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes (RLS-scoped; current `@supabase/ssr` name; formerly anon key) |

### Public invoice

Expose only: business public details, invoice content, totals, payment status, Pay button.  
Do not expose: user id, org id, Stripe account id, other invoices, revenue, clients list.

### Web / app security

- Sanitize notes, terms, names, descriptions (no raw HTML unless sanitized)
- Cookies: HttpOnly, Secure, SameSite as required by Supabase SSR
- CSRF: Next.js server actions + SameSite; origin checks on sensitive POST
- Rate limits: magic link, login, public invoice GET, pay session, share, PDF, APIs, contact, webhooks (Stripe retries are OK; still cap abuse)
- File uploads: MIME allowlist, size cap, sanitize names, scan if available, store in Storage
- Structured logs with redaction (tokens, secrets, Authorization, Stripe-Signature payload secrets)
- Typed errors: `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `NotFoundError`, `StripeConnectionError`, `PaymentError`, `SubscriptionError`, `PDFGenerationError` — safe messages to clients, no stack traces

### AuditLog actions

invoice created/updated/sent/shared/deleted · client created/updated · Stripe connected/disconnected · subscription changed · reminder sent · member invited · role changed

Never log payment credentials or secrets.

---

## 15. Frontend UX

### Themes

Same design tokens.

- Public website: **light-first**
- Dashboard: **light-first** (forest green, no dark chrome)
- User theme preference stored on User (not used by the dashboard; public invoice page may still honor stored theme)

### Legal and cookies

Public routes `/privacy`, `/terms`, `/cookies`. First visit shows a cookie choice window (necessary always on; analytics/marketing opt-in). See [`docs/legal.md`](./docs/legal.md).

### Responsive

**Invoice builder**

- Desktop: 50/50 form | live preview
- Mobile: Edit / Preview switch

**Dashboard**

- Desktop: compact collapsible sidebar
- Mobile tab bar: Overview · Invoices · Clients · Payments · More  
  More: Reports, Settings, Team, Billing, Notifications
- Drawers → mobile sheets / fullscreen

### i18n

English in `messages/en.json`. No hardcoded UI strings. Locale + timezone + date format from User/BusinessProfile. Currency ISO 4217.

### Invoice builder state

Local form state, debounced display calculations, **server validation and recompute** before save / send / pay / PDF.

---

## 16. Testing (required)

Especially:

1. Connected-account Checkout **never** created without `Stripe-Account`
2. Payload **never** contains `application_fee_amount`
3. Payload **never** contains transfer / destination charge fields
4. Platform subscription Checkout **never** receives `stripeAccount`
5. Webhook: Connect event cannot update Subscription; platform event cannot mark Invoice PAID
6. Invoice not marked PAID from success URL alone
7. Idempotent webhooks (duplicate `eventId`)
8. Money: discounts, tax, currency exponents, rounding
9. Invoice numbering under concurrency (two parallel creates)
10. `requireInvoiceAccess` denies cross-tenant
11. Entitlements: Free cannot create Connect checkout / reminders
12. Public invoice does not leak internal IDs
13. Reminders skip PAID/CANCELED
14. Magic link rate limit

Also: auth, clients, PDF generation smoke, reports tenant isolation.

---

## 17. Stripe completion checklist

Copy to the Stripe implementation PR. All must be true:

- [x] User invoice payments are **direct charges** on connected accounts
- [x] Connected account is merchant of record
- [x] Platform account does not receive invoice payment funds
- [x] No destination charges
- [x] No separate charges and transfers
- [x] No `application_fee_amount`
- [x] No platform transaction percentage
- [x] `fees_collector = stripe`
- [x] `losses_collector = stripe` (do not ship if Stripe rejects this combo; do not silently switch to application)
- [x] Refunds belong to the connected account (Puyer does not execute them)
- [x] Disputes belong to the connected account
- [x] Puyer only synchronizes payment status
- [x] Platform Stripe used only for Pro/Business
- [x] Two webhook endpoints + two secrets; domain isolation tested
- [x] No secret keys exposed
- [x] All webhooks signature-verified
- [x] Webhook processing idempotent
- [x] Payment success from verified Stripe events, not redirects
- [x] Official Stripe SDK only; API version pinned; docs re-checked

Evidence map: [`docs/stripe-checklist.md`](./docs/stripe-checklist.md).

---

## 18. Environment (`.env.example`, never commit secrets)

```
# App
NEXT_PUBLIC_APP_URL=

# Supabase — @supabase/ssr current API uses the publishable key
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                 # transaction pooler :6543; runtime always adds pgbouncer=true
DIRECT_URL=                   # 5432 for Prisma migrate

# Stripe — platform (Domain A) + Connect requests
STRIPE_SECRET_KEY=            # sk_test_ in development
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET_PLATFORM=
STRIPE_WEBHOOK_SECRET_CONNECT=
STRIPE_PLATFORM_PRICE_PRO=
STRIPE_PLATFORM_PRICE_BUSINESS=
STRIPE_API_VERSION=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Email — Resend + Auth Send Email hook (HTTPS: /api/auth/send-email)
RESEND_API_KEY=
EMAIL_FROM=
SEND_EMAIL_HOOK_SECRET=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Development: **Stripe test mode only**.

---

## 19. Implementation phases (must follow this order)

Do not start a later phase until the previous phase’s tests/typecheck are green enough to build on.

### Phase 0 — Bootstrap

- Next.js **16** App Router via current `create-next-app` defaults (TypeScript, Tailwind, ESLint, Turbopack, `@/*`). Re-check version with Context7 `/vercel/next.js`.
- `next-intl` + `messages/en.json`
- Prisma + Supabase connection (pooler + direct)
- `.env.example`, README + `AGENTS.md` pointing to this PLAN
- Folder skeleton matching §9
- Error types, logger, Money helper
- CI: `lint`, `typecheck`, `test`

### Phase 1 — Identity and tenancy

- `@supabase/ssr`: `createBrowserClient` / `createServerClient` in `utils/supabase/*`. Cookie adapter uses Next `request.cookies.getAll()` / `setAll` (Context7 `/supabase/supabase` Next.js prompt). `parseCookieHeader` is for non-Next runtimes.
- Magic link only: `signInWithOtp({ email })` — do not copy password examples from SSR snippets
- Public `/login` is a split page (email form + invoice hero). Download/Share still use the landing modal.
- User / Organization / Member / BusinessProfile
- Session refresh in Next.js 16 `proxy.ts` (deprecated filename: `middleware.ts`) via `updateSession` + `auth.getClaims()`. Do not login-gate public marketing routes.
- Authorization helpers + RLS policies
- Audit log foundation
- Tests: auth, tenant isolation

### Phase 2 — Invoice domain

- Clients, Products, Invoices, Items, Sequences
- Server-side totals
- Status machine (DRAFT → READY → SENT → …)
- Invoice builder UI (responsive 50/50 + mobile switch)
- Public `publicId` (no pay button yet)
- Tests: calculations, numbering concurrency, access control

### Phase 3 — PDF and sharing

- Three templates, A4 / Letter
- Storage + signed URLs
- Public invoice page security + rate limit
- Tests: no ID leakage, PDF smoke

### Phase 4 — Stripe Connect (Domain B)

- Re-read current Stripe Accounts v2 + direct charge docs
- `StripeConnectService`
- Onboarding UI + connection status
- Pay Invoice → Checkout on connected account
- Connect webhook endpoint + InvoicePayment sync
- Tests from §16 items 1–7

### Phase 5 — Platform subscriptions (Domain A)

- `StripePlatformService`
- Entitlement service
- Billing UI + Customer Portal
- Platform webhooks
- Server-side entitlement on Connect, reminders, reports, teams
- Tests: domain isolation, entitlements

### Phase 6 — Reminders, email, notifications

- Inngest functions
- Reminder engine
- Notification + preferences
- Tests: skip PAID/CANCELED, idempotent send

### Phase 7 — Reports

- Base reports (all plans): revenue, paid, outstanding, overdue
- Advanced (Business): trends, overdue rate, avg payment time, client performance, currency breakdown, monthly
- Forecasting / insights / team analytics (Business)
- Snapshots via jobs
- Tenant isolation tests

### Phase 8 — Teams (Business)

- Invite member, roles, permission matrix
- Server enforcement
- Audit: invite, role change

### Help Center

- Public `/help` with searchable guides and a contact form
- `POST /api/help` rate-limited; Resend to the support inbox; `SupportRequest` rows for signed-in history
- Docs: docs/help.md

### Phase 9 — Hardening

- Rate limits on all listed surfaces
- Upload validation
- Observability
- Playwright: signup → invoice → share → (test-mode) pay path
- Load-conscious indexes
- Stripe checklist §17 complete

### Phase 10 — Launch readiness

- Vercel project + env
- Supabase production project
- Stripe live keys + both webhook endpoints
- Inngest production app
- Backups, uptime, runbooks (webhook replay, failed jobs)

---

## 20. Coding standards for this repo

- SOLID / KISS / DRY / YAGNI — modular monolith, not a distributed system
- Prefer explicit domain functions over fat route handlers
- Every premium mutation: `requireEntitlement` first
- Every tenant read/write: `require*Access` first
- No `any` in money/Stripe/auth code
- Idempotency for: payment session create, subscription create, reminders, webhooks, PDF if expensive
- Financial writes in DB transactions
- Do not generate fake Stripe implementations
- **Context7 before library code.** Do not implement Stripe, Next.js, Supabase, Prisma, or Inngest APIs from memory if Context7 is available.
- Never paste Stripe sample `application_fee_amount` or `recipient` / `stripe_transfers` into Puyer.

---

## 21. Open points to re-verify at implementation (do not block Phase 0–3)

1. Exact Accounts v2 payload for `merchant` + `dashboard: "full"` + `fees_collector/losses_collector: "stripe"` on the SDK version we pin. Context7 already shows this combo as valid option values; confirm it is accepted together for our countries.
2. Whether Account Links v2 `configurations: ["merchant"]` is sufficient (Context7/docs examples often include `recipient` — **recipient is wrong for Puyer**).
3. Express vs full dashboard: we choose **full** so the business is clearly MoR and Stripe recommends direct charges with full Dashboard. If Stripe account onboarding for a country cannot use `full` + `losses_collector: stripe`, stop and update this plan — do not silently take liability.
4. PDF visual parity: if `@react-pdf/renderer` drifts from HTML preview, schedule Chromium worker (Railway/Fly) as a **PDF-only** service.

---

## 22. Documentation policy

This `PLAN.md` is the **source of truth**.

When a feature ships, add a short module doc under `docs/` (purpose, how to use, how to test, limits, modules touched) and a changelog line below.

Until `docs/` exists, keep the changelog in this file.

---

## Changelog

```
[2026-08-29] – Added: Client create/update require email (optional phone); invoice timeline is a stable two-column rail.
  Docs: docs/dashboard.md, docs/invoices.md, docs/reminders.md, docs/UX_FLOWS.md.

[2026-08-29] – Fixed: Magic links confirm on click-through `/auth/confirm` so GET prefetch does not expire the token.
  Docs: docs/auth.md, docs/UX_FLOWS.md.

[2026-08-29] – Added: Organization.planSource and subscriptionStatus for Table Editor plan grants.
  Docs: docs/billing.md.

[2026-08-29] – Changed: Revenue Trends fills the card with an SVG gradient; Paid invoices show Payment Received on the timeline.
  Docs: docs/dashboard.md, docs/reports.md, docs/invoices.md, docs/UX_FLOWS.md.

[2026-08-29] – Added: Invoice drawer manual reminders (editable body, reminders@puyer.org) and allowed status changes.
  Docs: docs/reminders.md, docs/invoices.md, docs/dashboard.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: KPI sparks fade with no top stroke; Clients KPIs match Home; Invoice KPIs use Phosphor; long names cannot stretch the shell.
  Docs: docs/dashboard.md, docs/invoices.md, docs/UX_FLOWS.md.

[2026-08-29] – Added: Clients row opens a right drawer (`?client=`) with preview, invoice history, edit, and delete.
  Docs: docs/dashboard.md, docs/invoices.md, docs/UX_FLOWS.md, docs/hardening.md.

[2026-08-27] – Added: Master architecture and implementation plan for Puyer.org.
  Stack locked: Next.js + Supabase + Prisma + Vercel + Inngest.
  Stripe: Accounts v2 + direct charges, no application fees, isolated platform billing.
  Railway rejected as primary host; optional future PDF worker only.

[2026-08-27] – Changed: Context7 MCP is now the mandatory docs source.
  Next.js pinned to 16 (Context7 /vercel/next.js v16.2.9).
  Stripe Connect Node pattern confirmed: checkout.sessions.create(params, { stripeAccount }).
  Explicit ban on copying Stripe sample application_fee_amount and recipient/transfers.
  Auth: @supabase/ssr + publishable key + signInWithOtp.
  Webhooks: raw body via req.blob().text() per current Next.js Stripe example.

[2026-08-27] – Added: Phase 0 bootstrap + Figma landing page.
  Next.js 16.2.9 App Router, Tailwind 4, Inter + JetBrains Mono.
  Marketing homepage implemented from Figma node 22017:230.
  Icons are Figma-exported SVGs in public/landing. No AI icons.
  i18n keys in messages/en.json. Docs: docs/landing.md.

[2026-08-27] – Added: Canonical interaction contract docs/UX_FLOWS.md.
  Public header + interactive landing Invoice Builder (live preview, bigint totals).
  Unauth Download/Share open registration modal (magic link UI stub).
  Leave-without-saving on dirty builder. /pricing page. Docs: docs/invoice-builder.md.

[2026-08-27] – Added: Public dark theme via CSS tokens + html[data-theme].
  Tailwind v4 @custom-variant (not prefers-color-scheme). Moon/sun header control.
  Invoice preview and solid actions follow dark tokens. Docs: docs/theme.md.

[2026-08-28] – Added: Supabase SSR clients (`@supabase/ssr` + `@supabase/supabase-js`).
  Publishable key env, `utils/supabase/{client,server,middleware}.ts`.
  Next.js 16 `proxy.ts` refreshes sessions with `getClaims()`. No todos demo page.
  Docs: docs/supabase.md.

[2026-08-28] – Added: Phase 1 identity (magic link + tenancy).
  Prisma 6 identity schema, `proxy.ts` session refresh via `getClaims()`,
  OTP API, auth callback, RLS trigger, Figma `/dashboard` + `/invoices` drawer.
  Docs: docs/auth.md, docs/dashboard.md. Authenticated builder remains a Phase 2 stub.

[2026-08-28] – Added: Phase 2 invoice domain.
  Clients, invoices, items, sequences, server totals, status machine, publicId.
  Authenticated builder persists; public `/invoice/[publicId]` has no pay button.
  Docs: docs/invoices.md.

[2026-08-28] – Added: Phase 3 PDF and sharing.
  Server `@react-pdf/renderer` (A4/Letter, three templates), private Storage cache,
  public download, in-process rate limits. Docs: docs/pdf.md.

[2026-08-28] – Fixed: Workspace provision for Auth users created before the identity trigger.
  `ensureWorkspace` + SQL backfill. Docs: docs/auth.md.

[2026-08-28] – Added: Phase 4 Stripe Connect (Domain B).
  Accounts v2 full dashboard, fees/losses collector stripe, merchant-only Account Links,
  direct-charge Checkout, Connect/platform webhooks, InvoicePayment sync.
  Docs: docs/stripe-connect.md.

[2026-08-28] – Added: Phase 5 platform subscriptions (Domain A).
  Stripe Billing Checkout + Customer Portal, Subscription sync, 7-day past_due grace,
  server entitlements on Connect/Pay, Billing UI, pricing Checkout.
  Docs: docs/billing.md.

[2026-08-28] – Added: Phase 6 reminders, email, notifications.
  Inngest cron + fan-out send, Resend, ReminderEvent idempotency, in-app inbox.
  Docs: docs/reminders.md.

[2026-08-28] – Added: Phase 7 reports.
  Base KPIs all plans; Business trends/forecast/insights/team; ReportSnapshot job.
  Docs: docs/reports.md.

[2026-08-28] – Added: Phase 8 teams.
  Invites, MEMBER/OWNER matrix, last-owner protection, accept URL, audit.
  Docs: docs/team.md.

[2026-08-28] – Added: Phase 9 hardening.
  Shared rate limits (Upstash optional), origin check, upload validation, log redaction,
  load indexes, Playwright pay-path smoke, §17 checklist mapped.
  Docs: docs/hardening.md, docs/stripe-checklist.md.

[2026-08-28] – Fixed: PDF wrap and Cyrillic.
  Noto Sans embed, character hyphenation, flexBasis 0 on text columns, hash layout 3.
  Docs: docs/pdf.md.

[2026-08-28] – Added: Auth Send Email hook via Resend (`SEND_EMAIL_HOOK_SECRET`) and branded magic-link templates.
  Docs: docs/auth.md.

[2026-08-28] – Added: Public `/login` split page (magic-link form + vector invoice hero).
  Header Login and gated routes go to `/login`. Download/Share stay on the landing modal.
  Docs: docs/auth.md, docs/UX_FLOWS.md.

[2026-08-28] – Changed: `/login` hero is `public/auth/login-hero.png`.
  Docs: docs/auth.md, docs/UX_FLOWS.md.

[2026-08-28] – Fixed: Settings page no longer 500s on Connect/workspace lookup failure.
  Sign out lives in the app shell and `POST /api/auth/signout` clears Auth cookies.
  Docs: docs/auth.md, docs/dashboard.md.

[2026-08-28] – Fixed: Hosted Auth still sent the default magic-link HTML.
  `npm run auth:push-templates` PATCHes mailer templates only (not full config push).
  Docs: docs/auth.md.

[2026-08-29] – Changed: `/login` white canvas, no theme toggle.
  Docs: docs/auth.md, docs/theme.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Landing template cards render live invoice layouts.
  Docs: docs/landing.md, docs/UX_FLOWS.md.

[2026-08-29] – Fixed: Template previews scale from top-left so they stay in the card.
  Docs: docs/landing.md.

[2026-08-29] – Added: Hover zoom on landing template invoice previews.
  Docs: docs/landing.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Invoice templates are visually distinct; PDF cache `layout: 4`.
  Docs: docs/pdf.md, docs/invoice-builder.md.

[2026-08-29] – Added: Platform disclaimer under Notes on every invoice (not the “Made with Puyer” footer).
  Docs: docs/invoices.md, docs/pdf.md, docs/invoice-builder.md.

[2026-08-29] – Added: Optional bank transfer details; stored only with explicit issuer consent.
  Docs: docs/invoices.md, docs/invoice-builder.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Landing Invoice Builder is two steps so the preview column stays compact.
  Docs: docs/landing.md, docs/invoice-builder.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Landing and `/pricing` stay light (no public theme toggle).
  Docs: docs/landing.md, docs/theme.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Invoice templates share one Figma document skeleton; PDF cache `layout: 7`.
  Docs: docs/pdf.md, docs/invoice-builder.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Site chrome and Auth mail use the Puyer lockup.
  Docs: docs/brand.md, docs/landing.md, docs/auth.md, docs/dashboard.md.

[2026-08-29] – Changed: Invoice footer is full-width payment only (no Terms column); PDF cache `layout: 8`.
  Docs: docs/pdf.md, docs/invoice-builder.md.

[2026-08-29] – Changed: Dashboard is light-first (forest green). No dark chrome or Overview theme toggle.


[2026-08-29] – Changed: Landing Features is a Phosphor-icon horizontal marquee.
  Docs: docs/landing.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Landing Why capabilities use dual Phosphor chip marquees.
  Docs: docs/landing.md.

[2026-08-29] – Changed: Landing How is a Phosphor step track with screenshot hover zoom.
  Docs: docs/landing.md.

[2026-08-29] – Changed: Landing Stripe flow uses Phosphor nodes; required payment copy unchanged.
  Docs: docs/landing.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Landing clients block has no CTA; marketing buttons use a light hover.
  Docs: docs/landing.md, docs/UX_FLOWS.md.

[2026-08-29] – Added: Privacy, Terms, Cookie Policy, and cookie choice window.
  Docs: docs/legal.md, docs/landing.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Landing pricing is Phosphor plan cards with a segmented Monthly/Yearly control.
  Docs: docs/landing.md, docs/billing.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Landing trust bar uses Phosphor chips; the three lines are unchanged.
  Docs: docs/landing.md, docs/theme.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Dashboard sidebar and mobile tabs use Phosphor nav icons.
  Docs: docs/dashboard.md, docs/UX_FLOWS.md.

[2026-08-29] – Changed: Overview KPIs have Phosphor + sparklines; six-month trends are ungated.
  Docs: docs/dashboard.md, docs/reports.md, docs/UX_FLOWS.md.

[2026-08-29] – Fixed: Team invite emails use `invites@puyer.org` and the request host; skipped Resend is a 400.
  Docs: docs/team.md, docs/UX_FLOWS.md.

[2026-08-29] – Fixed: Sent and viewed invoices stay editable in the builder; paid stay locked.
  Docs: docs/invoices.md, docs/dashboard.md, docs/UX_FLOWS.md.

[2026-08-29] – Fixed: Mobile invoice and client list tables scroll; pills no longer overlap amounts.
  Docs: docs/dashboard.md, docs/UX_FLOWS.md.

[2026-08-29] – Added: Square tab favicon from the Puyer ring mark (`app/icon.svg`).
  Docs: docs/brand.md.

[2026-08-29] – Changed: UX contract polish — payer theme toggle, `/invoices/new?template=`, client picker, payments drawer.
  Docs: docs/UX_FLOWS.md, docs/theme.md, docs/dashboard.md, docs/invoice-builder.md.

[2026-08-29] – Added: Help Center (`/help`) with contact form, searchable guides, and Resend support mail.
  Docs: docs/help.md, docs/UX_FLOWS.md, docs/dashboard.md.

[2026-08-29] – Fixed: Help/Resend reads `RESEND_API_KEY` at request runtime and uses verified `EMAIL_FROM` when `help@` is unset.
  Docs: docs/help.md.

[2026-08-29] – Fixed: `/api/help` pins static `process.env.RESEND_API_KEY` so Vercel does not omit the key from the function.
  Docs: docs/help.md.

[2026-08-29] – Fixed: Resend uses `node:process.env` so webpack cannot inline an empty `RESEND_API_KEY` on Vercel.
  Docs: docs/help.md.
```

---

**Уверенность: 91%**

Повышено повторным запросом через Context7 (`/websites/stripe`, `/vercel/next.js/v16.2.9`, `/supabase/ssr`). Архитектура доменов Stripe не изменилась. Уточнены SDK-паттерны и версия Next.js.

Остаточный риск: Stripe Accounts v2 всё ещё эволюционирует; recipient/transfers в официальных шаблонах легко скопировать по ошибке — это закрыто правилом в плане и тестами в Phase 4.
