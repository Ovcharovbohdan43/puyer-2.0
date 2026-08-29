import { describe, expect, it } from "vitest";

import { kpiSparkSpecs, sparklinePath } from "@/lib/dashboard/kpi-sparkline";
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
