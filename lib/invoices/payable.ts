import type { InvoiceStatus } from "@prisma/client";

const BLOCKED: ReadonlySet<InvoiceStatus> = new Set(["DRAFT", "PAID", "CANCELED"]);

export function isPayableStatus(status: InvoiceStatus): boolean {
  return !BLOCKED.has(status);
}

export function paidStatusForAmount(amountMinor: bigint, invoiceTotalMinor: bigint): "PAID" | "PARTIALLY_PAID" {
  return amountMinor >= invoiceTotalMinor && invoiceTotalMinor > 0n ? "PAID" : "PARTIALLY_PAID";
}

export function checkoutRedirectIsAuthoritative(): boolean {
  return false;
}
