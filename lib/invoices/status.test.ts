import { describe, expect, it } from "vitest";

import { isEditableStatus, manualStatusOptions } from "@/lib/invoices/status";

describe("manualStatusOptions", () => {
  it("omits overdue overlay and lists allowed next statuses", () => {
    expect(manualStatusOptions("SENT")).toEqual(["VIEWED", "PARTIALLY_PAID", "PAID", "CANCELED"]);
    expect(manualStatusOptions("PAID")).toEqual([]);
  });
});

describe("isEditableStatus", () => {
  it("lets unpaid invoices stay in the builder after share or view", () => {
    expect(isEditableStatus("DRAFT")).toBe(true);
    expect(isEditableStatus("READY")).toBe(true);
    expect(isEditableStatus("SENT")).toBe(true);
    expect(isEditableStatus("VIEWED")).toBe(true);
    expect(isEditableStatus("OVERDUE")).toBe(true);
    expect(isEditableStatus("PARTIALLY_PAID")).toBe(false);
    expect(isEditableStatus("PAID")).toBe(false);
    expect(isEditableStatus("CANCELED")).toBe(false);
  });
});
