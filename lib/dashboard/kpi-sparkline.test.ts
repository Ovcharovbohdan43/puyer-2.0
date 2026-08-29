import { describe, expect, it } from "vitest";

import { kpiSparkSpecs, sparklinePath, sparkMonthlyFromInvoices } from "@/lib/dashboard/kpi-sparkline";
import type { WorkspaceKpis } from "@/lib/invoices/list-view";
import type { PresentedTrend } from "@/lib/reports/present";

const emptyKpis: WorkspaceKpis = {
  currency: "USD",
  revenue: "$0.00",
  paidCount: 0,
  paid30: "$0.00",
  paid30Count: 0,
  outstanding: "$0.00",
  outstandingCount: 0,
  overdue: "$0.00",
  overdueCount: 0,
};

describe("kpiSparkSpecs", () => {
  it("uses a good tone when paid months rise and nothing is overdue", () => {
    const monthly: PresentedTrend[] = [
      { period: "2026-03", label: "Mar", paid: "$10", heightPct: 20 },
      { period: "2026-04", label: "Apr", paid: "$40", heightPct: 80 },
    ];
    const specs = kpiSparkSpecs(monthly, emptyKpis);
    expect(specs.revenue.tone).toBe("good");
    expect(specs.overdue.tone).toBe("good");
    expect(sparklinePath(specs.revenue.values, 100, 40).line.startsWith("M")).toBe(true);
  });

  it("marks overdue as a bad sparkline when overdue invoices exist", () => {
    const specs = kpiSparkSpecs([], { ...emptyKpis, overdueCount: 2, outstandingCount: 2 });
    expect(specs.overdue.tone).toBe("bad");
    expect(specs.outstanding.tone).toBe("warn");
  });
});

describe("sparkMonthlyFromInvoices", () => {
  it("maps invoice totals onto the last six UTC months", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    const monthly = sparkMonthlyFromInvoices(
      [
        {
          id: "i1",
          invoiceNumber: "INV-1",
          publicId: "p",
          clientId: "c1",
          clientName: "A",
          date: "2026-08-01",
          dueDate: "2026-08-10",
          amount: "$10.00",
          totalMinor: "1000",
          currency: "USD",
          status: "SENT",
          displayStatus: "SENT",
          createdAt: "2026-08-01",
          sentAt: null,
          viewedAt: null,
          paidAt: null,
        },
        {
          id: "i2",
          invoiceNumber: "INV-2",
          publicId: "p2",
          clientId: "c1",
          clientName: "A",
          date: "2026-07-01",
          dueDate: "2026-07-10",
          amount: "$20.00",
          totalMinor: "2000",
          currency: "USD",
          status: "PAID",
          displayStatus: "PAID",
          createdAt: "2026-07-01",
          sentAt: null,
          viewedAt: null,
          paidAt: "2026-07-01",
        },
      ],
      now,
    );
    expect(monthly).toHaveLength(6);
    expect(monthly.at(-1)?.period).toBe("2026-08");
    expect(monthly.find((row) => row.period === "2026-07")?.heightPct).toBe(100);
  });
});
