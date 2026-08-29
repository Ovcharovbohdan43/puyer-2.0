import { describe, expect, it } from "vitest";

import { toPaymentListRow } from "@/lib/payments/present";

describe("toPaymentListRow", () => {
  it("formats bigint amounts as strings so RSC never serializes Prisma money fields", () => {
    const row = toPaymentListRow({
      id: "pay_1",
      amountMinor: 1250n,
      currency: "USD",
      status: "SUCCEEDED",
      invoice: { invoiceNumber: "INV-2026-0001", publicId: "pub_1", clientName: "Acme" },
    });
    expect(row).toEqual({
      id: "pay_1",
      invoiceNumber: "INV-2026-0001",
      invoicePublicId: "pub_1",
      clientName: "Acme",
      amount: "$12.50",
      status: "SUCCEEDED",
    });
    expect(typeof row.amount).toBe("string");
  });
});
