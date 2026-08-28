import { describe, expect, it } from "vitest";

import { computeWorkspaceKpis, toInvoiceListRow } from "@/lib/invoices/list-view";

describe("computeWorkspaceKpis", () => {
  it("sums outstanding and overdue in the dominant currency and never mixes currencies", () => {
    const now = new Date("2026-08-28T12:00:00.000Z");
    const overdue = toInvoiceListRow(
      {
        id: "1",
        invoiceNumber: "INV-2026-0001",
        publicId: "aaaaaaaaaaaaaaaaaaaaaa",
        clientName: "Acme",
        issueDate: new Date("2026-01-01T00:00:00.000Z"),
        dueDate: new Date("2026-01-15T00:00:00.000Z"),
        totalMinor: 10000n,
        currency: "USD",
        status: "SENT",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        sentAt: new Date("2026-01-02T00:00:00.000Z"),
        viewedAt: null,
      },
      now,
    );
    const eur = toInvoiceListRow(
      {
        id: "2",
        invoiceNumber: "INV-2026-0002",
        publicId: "bbbbbbbbbbbbbbbbbbbbbb",
        clientName: "Euro Co",
        issueDate: new Date("2026-08-01T00:00:00.000Z"),
        dueDate: new Date("2026-09-01T00:00:00.000Z"),
        totalMinor: 99999n,
        currency: "EUR",
        status: "SENT",
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        sentAt: new Date("2026-08-01T00:00:00.000Z"),
        viewedAt: null,
      },
      now,
    );
    const usdOpen = toInvoiceListRow(
      {
        id: "3",
        invoiceNumber: "INV-2026-0003",
        publicId: "cccccccccccccccccccccc",
        clientName: "Beta",
        issueDate: new Date("2026-08-01T00:00:00.000Z"),
        dueDate: new Date("2026-09-01T00:00:00.000Z"),
        totalMinor: 2500n,
        currency: "USD",
        status: "READY",
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        sentAt: null,
        viewedAt: null,
      },
      now,
    );

    const kpis = computeWorkspaceKpis([overdue, eur, usdOpen], now);
    expect(kpis.currency).toBe("USD");
    expect(kpis.overdueCount).toBe(1);
    expect(kpis.outstandingCount).toBe(2);
    expect(kpis.overdue).toBe("$100.00");
    expect(kpis.outstanding).toBe("$125.00");
    expect(kpis.revenue).toBe("$0.00");
    expect(kpis.paid30).toBe("$0.00");
    expect(kpis.paid30Count).toBe(0);
  });
});
