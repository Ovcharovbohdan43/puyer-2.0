import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}));

import { OverviewScreen } from "@/components/dashboard/overview-screen";

const kpis = {
  currency: "USD",
  revenue: "$0.00",
  paidCount: 0,
  paid30: "$0.00",
  paid30Count: 0,
  outstanding: "$37,952.22",
  outstandingCount: 1,
  overdue: "$0.00",
  overdueCount: 0,
};

describe("OverviewScreen", () => {
  it("shows revenue trends without a Business upgrade wall and readable quick actions", () => {
    const html = renderToStaticMarkup(
      <OverviewScreen
        name="Ada"
        email="ada@puyer.test"
        remindersEnabled={false}
        recent={[]}
        kpis={kpis}
        monthly={[{ period: "2026-08", label: "Aug", paid: "$0.00", heightPct: 0 }]}
        insights={null}
      />,
    );

    expect(html).toContain("Revenue Trends");
    expect(html).not.toContain("Six-month trends are a Business feature");
    expect(html).toContain("Quick Actions");
    expect(html).toContain("Add Client");
    expect(html).toContain("hover:bg-[#F6FBF8]");
    expect(html).toContain("kpi-revenue-fill");
    expect(html).toContain('stop-opacity="0"');
  });
});
