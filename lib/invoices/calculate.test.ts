import { describe, expect, it } from "vitest";

import { calculateInvoiceTotals } from "@/lib/invoices/calculate";
import { lineAmountMinor } from "@/lib/invoices/money";

describe("invoice money", () => {
  it("multiplies quantity and unit price in minor units", () => {
    expect(lineAmountMinor("1", "2500.00", 2)).toBe(250000n);
    expect(lineAmountMinor("40", "100.00", 2)).toBe(400000n);
    expect(lineAmountMinor("1.5", "10.00", 2)).toBe(1500n);
  });

  it("handles zero-decimal currency", () => {
    expect(lineAmountMinor("3", "250", 0)).toBe(750n);
  });
});

describe("invoice totals", () => {
  it("sums lines then applies percent discount and tax", () => {
    const totals = calculateInvoiceTotals(
      [
        { quantity: "1", unitPrice: "2500.00" },
        { quantity: "40", unitPrice: "100.00" },
      ],
      2,
      "PERCENT",
      "10",
      "20",
    );

    expect(totals.subtotal).toBe(650000n);
    expect(totals.discountAmount).toBe(65000n);
    expect(totals.taxable).toBe(585000n);
    expect(totals.taxAmount).toBe(117000n);
    expect(totals.total).toBe(702000n);
  });

  it("caps fixed discount at subtotal", () => {
    const totals = calculateInvoiceTotals(
      [{ quantity: "1", unitPrice: "10.00" }],
      2,
      "FIXED",
      "50.00",
      "0",
    );
    expect(totals.discountAmount).toBe(1000n);
    expect(totals.total).toBe(0n);
  });

  it("does not use floating point for tax", () => {
    const totals = calculateInvoiceTotals([{ quantity: "1", unitPrice: "0.10" }], 2, "NONE", "0", "10");
    expect(totals.taxAmount).toBe(1n);
    expect(totals.total).toBe(11n);
  });
});
