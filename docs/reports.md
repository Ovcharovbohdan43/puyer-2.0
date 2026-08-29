# Reports (Phase 7)

## Purpose

Show workspace invoice totals for every plan, and Business-only analytics (trends, overdue rate, payment time, clients, currencies, forecast, insights, creator breakdown). Snapshots are written by an Inngest job for monthly history.

## Description

- **Base (Free / Pro / Business):** lifetime revenue, paid in the last 30 days, outstanding, overdue. Same currency rule as Overview KPIs: never mix currencies; use the most common invoice currency.
- **Advanced (Business):** last 6 months of paid totals, overdue rate among issued invoices, average days from send/issue to first successful Connect payment, client ranking, per-currency breakdown, next-month forecast (mean of the last 3 complete months), payment-time insight vs last month, invoices grouped by `createdByUserId`.
- `/reports` and Overview load one tenant-scoped invoice query. Advanced fields are `null` unless `can(ADVANCED_REPORTS)`.
- `ReportSnapshot` stores JSON metrics for the current UTC month. Money in JSON is **strings** (bigint-safe). Daily cron `0 2 * * *` fans out `puyer/report.snapshot`. Completed months on the trend chart prefer the latest snapshot; the current month stays live.

Tenant isolation: `scopeToOrganization` drops other `organizationId`s before totaling. Queries never load another workspace.

Re-checked Context7 `/prisma/web` (Json + composite unique upsert) and `/websites/inngest` (`cron()` + `eventType()` v4) on 2026-08-28.

## How to use

1. Apply [`supabase/migrations/20260828240000_report_snapshots.sql`](../supabase/migrations/20260828240000_report_snapshots.sql). `npx prisma generate`.
2. Sign in → `/reports`. Free/Pro see four KPI cards plus a Business upgrade CTA. Business sees the full page.
3. Local snapshots: `INNGEST_DEV=1` and/or `npx inngest-cli@latest dev` so `/api/inngest` can run the daily cron (or invoke the function from the Inngest Dev Server).

## Examples

- Two USD invoices (one overdue $100, one open $25) plus a EUR open invoice → outstanding `$125.00`, overdue `$100.00`. EUR is listed only in the currency table on Business.
- Paid $300 / $600 / $900 in May–July UTC → August forecast `$600.00`.
- Free `computeWorkspaceReport(..., "FREE")` returns `advanced: null` even if the engine could compute it.

## How to test

```bash
npm run test
npm run typecheck
npm run lint
```

Browser:

- `/reports` while signed in shows live KPIs from this workspace.
- Free/Pro: upgrade CTA to `/billing`. Business: trends and tables without the CTA.
- Overview Revenue Trends / Insights follow the same Business gate (no fake 14-day copy).

## Limitations

- Forecast is a 3-month arithmetic mean of paid invoice totals in the dominant currency, not a statistical model.
- Average payment time needs a `SUCCEEDED` `InvoicePayment.paidAt`. Manually marked PAID invoices without a payment row are excluded from that average.
- Team analytics is “who created the invoice,” not Phase 8 seats.
- Mixed-currency KPI cards still hide non-dominant currencies on every plan; Business shows the breakdown table.

## Modules

- `lib/reports/**`, `lib/jobs/reports.ts`
- `app/(dashboard)/reports/page.tsx`, `components/dashboard/reports-screen.tsx`, `components/dashboard/trend-bars.tsx`
- `app/(dashboard)/dashboard/page.tsx`, `components/dashboard/overview-screen.tsx`
- `prisma/schema.prisma`, `supabase/migrations/20260828240000_report_snapshots.sql`

## Version

1.0.2 — 2026-08-29

## Changelog

```
[2026-08-28] – Added: Base reports for all plans, Business analytics, monthly ReportSnapshot job, tenant isolation tests.
[2026-08-28] – Changed: Paid (30d) is a real window; snapshots feed completed months; Overview no longer duplicates revenue or shows a fake chart.
[2026-08-29] – Fixed: Missing `InvoicePayment` / pooler errors no longer blank `/reports`; payments load is isolated.
```
