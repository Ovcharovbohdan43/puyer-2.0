import { describe, expect, it } from "vitest";

import { dash } from "@/lib/dashboard/chrome";

describe("dashboard table chrome", () => {
  it("sizes columns from content so mobile tables scroll instead of overlapping", () => {
    expect(dash.dataTable).toContain("table-auto");
    expect(dash.dataTable).toContain("min-w-full");
    expect(dash.dataTable).not.toContain("table-fixed");
    expect(dash.tableScroll).toContain("overflow-x-auto");
    expect(dash.cellNowrap).toBe("whitespace-nowrap");
  });

  it("lets date fields shrink on a narrow toolbar instead of overflowing", () => {
    expect(dash.dateInput).toContain("w-full");
    expect(dash.dateInput).toContain("min-w-0");
    expect(dash.dateInput).toContain("max-w-full");
  });
});
