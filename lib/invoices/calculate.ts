import { lineAmountMinor, parseMajorToMinor } from "@/lib/invoices/money";

export type DiscountType = "NONE" | "PERCENT" | "FIXED";

export type CalcLineItem = {
  quantity: string;
  unitPrice: string;
};

export type InvoiceTotals = {
  lineAmounts: bigint[];
  subtotal: bigint;
  discountAmount: bigint;
  taxable: bigint;
  taxAmount: bigint;
  total: bigint;
};

function percentOf(amount: bigint, percentInput: string): bigint {
  const bps = parseMajorToMinor(percentInput || "0", 4);
  return (amount * bps) / 1_000_000n;
}

export function calculateInvoiceTotals(
  items: CalcLineItem[],
  exponent: number,
  discountType: DiscountType,
  discountValue: string,
  taxPercent: string,
): InvoiceTotals {
  const lineAmounts = items.map((item) => lineAmountMinor(item.quantity, item.unitPrice, exponent));
  const subtotal = lineAmounts.reduce((sum, amount) => sum + amount, 0n);

  let discountAmount = 0n;
  if (discountType === "PERCENT") {
    discountAmount = percentOf(subtotal, discountValue);
  } else if (discountType === "FIXED") {
    discountAmount = parseMajorToMinor(discountValue || "0", exponent);
  }
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }
  if (discountAmount < 0n) {
    discountAmount = 0n;
  }

  const taxable = subtotal - discountAmount;
  const taxAmount = percentOf(taxable, taxPercent);
  const total = taxable + taxAmount;

  return { lineAmounts, subtotal, discountAmount, taxable, taxAmount, total };
}

export function emptyTotals(lineCount: number): InvoiceTotals {
  return {
    lineAmounts: Array.from({ length: lineCount }, () => 0n),
    subtotal: 0n,
    discountAmount: 0n,
    taxable: 0n,
    taxAmount: 0n,
    total: 0n,
  };
}

export function totalsForInvoice(
  items: CalcLineItem[],
  exponent: number,
  discountType: DiscountType,
  discountValue: string,
  taxPercent: string,
): InvoiceTotals {
  try {
    return calculateInvoiceTotals(
      items,
      exponent,
      discountType,
      discountType === "NONE" ? "0" : discountValue,
      taxPercent || "0",
    );
  } catch {
    return emptyTotals(items.length);
  }
}
