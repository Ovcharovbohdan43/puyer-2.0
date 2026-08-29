import { describe, expect, it } from "vitest";

import { manualStatusOptions } from "@/lib/invoices/status";

describe("manualStatusOptions", () => {
  it("omits overdue overlay and lists allowed next statuses", () => {
    expect(manualStatusOptions("SENT")).toEqual(["VIEWED", "PARTIALLY_PAID", "PAID", "CANCELED"]);
    expect(manualStatusOptions("PAID")).toEqual([]);
  });
});
