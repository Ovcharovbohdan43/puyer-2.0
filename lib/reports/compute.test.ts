import { describe, expect, it } from "vitest";

import { can } from "@/lib/entitlements";
import {
  computeBaseReport,
  computeFullReport,
  computeWorkspaceReport,
  mergeLiveMonthlyWithSnapshot,
  scopeToOrganization,
  toSnapshotMetrics,
  type ReportInvoice,
  type ReportPayment,
} from "@/lib/reports/compute";

const now = new Date("2026-08-28T12:00:00.000Z");
const orgA = "11111111-1111-1111-1111-111111111111";
const orgB = "22222222-2222-2222-2222-222222222222";

function invoice(partial: Partial<ReportInvoice> & Pick<ReportInvoice, "id" | "organizationId">): ReportInvoice {
  return {
    clientId: "client-a",
    clientName: "Acme",
    createdByUserId: "user-1",
    creatorName: "Ada",
    currency: "USD",
    status: "SENT",
    issueDate: new Date("2026-08-01T00:00:00.000Z"),
    dueDate: new Date("2026-09-01T00:00:00.000Z"),
    sentAt: new Date("2026-08-01T00:00:00.000Z"),
    totalMinor: 10000n,
    ...partial,
  };
}

function payment(partial: Partial<ReportPayment> & Pick<ReportPayment, "invoiceId" | "organizationId">): ReportPayment {
  return {
    amountMinor: 10000n,
    currency: "USD",
    status: "SUCCEEDED",
    paidAt: new Date("2026-08-10T00:00:00.000Z"),
    ...partial,
  };
}

describe("report tenant isolation", () => {
  it("drops rows from other organizations before totaling", () => {
    const mixed = [
      invoice({ id: "a-paid", organizationId: orgA, status: "PAID", totalMinor: 5000n }),
      invoice({ id: "b-paid", organizationId: orgB, status: "PAID", totalMinor: 9_999_999n }),
    ];
    const scoped = scopeToOrganization(mixed, orgA);
    expect(scoped).toHaveLength(1);
    expect(scoped[0]?.id).toBe("a-paid");
    const report = computeWorkspaceReport(orgA, mixed, [], "FREE", now);
    expect(report.base.revenueMinor).toBe(5000n);
    expect(report.base.paidCount).toBe(1);
  });
});

describe("report currency isolation", () => {
  it("never mixes currencies into a single total", () => {
    const invoices = [
      invoice({
        id: "usd-overdue",
        organizationId: orgA,
        status: "SENT",
        dueDate: new Date("2026-01-15T00:00:00.000Z"),
        totalMinor: 10000n,
        currency: "USD",
      }),
      invoice({
        id: "eur-open",
        organizationId: orgA,
        clientId: "client-eu",
        clientName: "Euro Co",
        currency: "EUR",
        totalMinor: 99999n,
        dueDate: new Date("2026-09-01T00:00:00.000Z"),
      }),
      invoice({
        id: "usd-open",
        organizationId: orgA,
        clientId: "client-b",
        clientName: "Beta",
        status: "READY",
        totalMinor: 2500n,
        sentAt: null,
      }),
    ];
    const base = computeBaseReport(invoices, [], now);
    expect(base.currency).toBe("USD");
    expect(base.overdueCount).toBe(1);
    expect(base.outstandingCount).toBe(2);
    expect(base.overdueMinor).toBe(10000n);
    expect(base.outstandingMinor).toBe(12500n);
    expect(base.revenueMinor).toBe(0n);
  });
});

describe("report entitlements and advanced metrics", () => {
  it("hides advanced payload on Free and Pro", () => {
    const invoices = [invoice({ id: "paid", organizationId: orgA, status: "PAID" })];
    expect(computeWorkspaceReport(orgA, invoices, [], "FREE", now).advanced).toBeNull();
    expect(computeWorkspaceReport(orgA, invoices, [], "PRO", now).advanced).toBeNull();
    expect(can({ plan: "PRO" }, "ADVANCED_REPORTS")).toBe(false);
    expect(computeWorkspaceReport(orgA, invoices, [], "BUSINESS", now).advanced).not.toBeNull();
  });

  it("computes overdue rate, payment time, forecast, and currency breakdown", () => {
    const invoices = [
      invoice({
        id: "paid-may",
        organizationId: orgA,
        status: "PAID",
        issueDate: new Date("2026-05-01T00:00:00.000Z"),
        sentAt: new Date("2026-05-01T00:00:00.000Z"),
        totalMinor: 30000n,
      }),
      invoice({
        id: "paid-jun",
        organizationId: orgA,
        status: "PAID",
        issueDate: new Date("2026-06-01T00:00:00.000Z"),
        sentAt: new Date("2026-06-01T00:00:00.000Z"),
        totalMinor: 60000n,
      }),
      invoice({
        id: "paid-jul",
        organizationId: orgA,
        status: "PAID",
        issueDate: new Date("2026-07-01T00:00:00.000Z"),
        sentAt: new Date("2026-07-01T00:00:00.000Z"),
        totalMinor: 90000n,
      }),
      invoice({
        id: "overdue",
        organizationId: orgA,
        clientId: "client-slow",
        clientName: "Slow Co",
        status: "SENT",
        dueDate: new Date("2026-01-01T00:00:00.000Z"),
        totalMinor: 40000n,
      }),
      invoice({
        id: "eur-paid",
        organizationId: orgA,
        clientId: "client-eu",
        clientName: "Euro Co",
        currency: "EUR",
        status: "PAID",
        totalMinor: 5000n,
      }),
      invoice({
        id: "draft",
        organizationId: orgA,
        status: "DRAFT",
        totalMinor: 80000n,
      }),
    ];
    const payments: ReportPayment[] = [
      payment({
        organizationId: orgA,
        invoiceId: "paid-may",
        paidAt: new Date("2026-05-11T00:00:00.000Z"),
        amountMinor: 30000n,
      }),
      payment({
        organizationId: orgA,
        invoiceId: "paid-jun",
        paidAt: new Date("2026-06-11T00:00:00.000Z"),
        amountMinor: 60000n,
      }),
      payment({
        organizationId: orgA,
        invoiceId: "paid-jul",
        paidAt: new Date("2026-07-11T00:00:00.000Z"),
        amountMinor: 90000n,
      }),
    ];
    const full = computeFullReport(orgA, invoices, payments, now);
    expect(full.advanced.overdueRate).toBe(0.2);
    expect(full.advanced.avgPaymentDays).toBe(10);
    expect(full.advanced.forecast.sourcePeriods).toEqual(["2026-05", "2026-06", "2026-07"]);
    expect(full.advanced.forecast.nextMonthPaidMinor).toBe(60000n);
    expect(full.advanced.currencies.find((row) => row.currency === "EUR")?.revenueMinor).toBe(5000n);
    expect(full.advanced.clients[0]?.clientName).toBe("Acme");
    expect(full.base.revenueMinor).toBe(180000n);
    expect(full.base.paidLast30Minor).toBe(0n);
    const snapshot = toSnapshotMetrics(full, now);
    expect(snapshot.base.revenueMinor).toBe("180000");
    expect(snapshot.base.paidLast30Minor).toBe("0");
    expect(snapshot.forecast.nextMonthPaidMinor).toBe("60000");
    expect(JSON.parse(JSON.stringify(snapshot)).version).toBe(1);
  });

  it("counts paid-last-30 from payment date and keeps older paid in lifetime revenue", () => {
    const invoices = [
      invoice({
        id: "old",
        organizationId: orgA,
        status: "PAID",
        issueDate: new Date("2026-01-01T00:00:00.000Z"),
        sentAt: new Date("2026-01-01T00:00:00.000Z"),
        totalMinor: 40000n,
      }),
      invoice({
        id: "recent",
        organizationId: orgA,
        status: "PAID",
        issueDate: new Date("2026-08-10T00:00:00.000Z"),
        sentAt: new Date("2026-08-10T00:00:00.000Z"),
        totalMinor: 15000n,
      }),
    ];
    const payments: ReportPayment[] = [
      payment({ organizationId: orgA, invoiceId: "old", paidAt: new Date("2026-01-20T00:00:00.000Z"), amountMinor: 40000n }),
      payment({ organizationId: orgA, invoiceId: "recent", paidAt: new Date("2026-08-20T00:00:00.000Z"), amountMinor: 15000n }),
    ];
    const base = computeBaseReport(invoices, payments, now);
    expect(base.revenueMinor).toBe(55000n);
    expect(base.paidCount).toBe(2);
    expect(base.paidLast30Minor).toBe(15000n);
    expect(base.paidLast30Count).toBe(1);
  });

  it("keeps the current month live when merging a snapshot into completed months", () => {
    const live = [
      { period: "2026-07", paidMinor: 1n, currency: "USD" },
      { period: "2026-08", paidMinor: 200n, currency: "USD" },
    ];
    const snapshot = toSnapshotMetrics(
      {
        base: {
          currency: "USD",
          revenueMinor: 0n,
          paidCount: 0,
          paidLast30Minor: 0n,
          paidLast30Count: 0,
          outstandingMinor: 0n,
          outstandingCount: 0,
          overdueMinor: 0n,
          overdueCount: 0,
        },
        advanced: {
          monthly: [
            { period: "2026-07", paidMinor: 90000n, currency: "USD" },
            { period: "2026-08", paidMinor: 1n, currency: "USD" },
          ],
          overdueRate: 0,
          avgPaymentDays: null,
          clients: [],
          currencies: [],
          forecast: { currency: "USD", nextMonthPaidMinor: 0n, sourcePeriods: [] },
          insights: { avgDays: null, previousAvgDays: null, improvedDays: null },
          team: [],
        },
      },
      now,
    );
    const merged = mergeLiveMonthlyWithSnapshot(live, snapshot, "2026-08");
    expect(merged[0]?.paidMinor).toBe(90000n);
    expect(merged[1]?.paidMinor).toBe(200n);
  });
});
