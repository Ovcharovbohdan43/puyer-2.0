import { describe, expect, it } from "vitest";

import { canHardDeleteInvoice, isEditableStatus, manualStatusOptions } from "@/lib/invoices/status";

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

describe("canHardDeleteInvoice", () => {
  it("blocks paid money and allows unpaid or canceled invoices", () => {
    expect(canHardDeleteInvoice("READY", false)).toBe(true);
    expect(canHardDeleteInvoice("SENT", false)).toBe(true);
    expect(canHardDeleteInvoice("CANCELED", false)).toBe(true);
    expect(canHardDeleteInvoice("PAID", false)).toBe(false);
    expect(canHardDeleteInvoice("PARTIALLY_PAID", false)).toBe(false);
    expect(canHardDeleteInvoice("READY", true)).toBe(false);
  });
});
