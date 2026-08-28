import type { BuilderState } from "@/components/invoice-builder/types";
import { calculateInvoiceTotals } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";
import { formatMinor, parseMajorToMinor, parseQuantity } from "@/lib/invoices/money";
import { ValidationError } from "@/lib/errors";
import { hasBuilderErrors, prepareBuilderState, validateBuilder } from "@/lib/invoices/validate";

export type ComputedInvoice = {
  currency: string;
  exponent: number;
  lineAmounts: bigint[];
  quantityMinors: bigint[];
  unitPriceMinors: bigint[];
  subtotalMinor: bigint;
  discountAmountMinor: bigint;
  taxAmountMinor: bigint;
  totalMinor: bigint;
};

export function assertValidBuilder(state: BuilderState): void {
  const errors = validateBuilder(state);
  if (hasBuilderErrors(errors)) {
    throw new ValidationError("Check the form and try again.");
  }
}

export function computeInvoiceFromBuilder(state: BuilderState): ComputedInvoice {
  const prepared = prepareBuilderState(state);
  assertValidBuilder(prepared);
  const currency = getCurrency(prepared.currency);
  const totals = calculateInvoiceTotals(
    prepared.items,
    currency.exponent,
    prepared.discountType,
    prepared.discountType === "NONE" ? "0" : prepared.discountValue,
    prepared.taxRate || "0",
  );
  return {
    currency: currency.code,
    exponent: currency.exponent,
    lineAmounts: totals.lineAmounts,
    quantityMinors: prepared.items.map((item) => parseQuantity(item.quantity)),
    unitPriceMinors: prepared.items.map((item) => parseMajorToMinor(item.unitPrice || "0", currency.exponent)),
    subtotalMinor: totals.subtotal,
    discountAmountMinor: totals.discountAmount,
    taxAmountMinor: totals.taxAmount,
    totalMinor: totals.total,
  };
}

export function formatStoredDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function parseIssueDue(issueDate: string, dueDate: string): { issue: Date; due: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new ValidationError("Enter valid issue and due dates.");
  }
  const issue = new Date(`${issueDate}T00:00:00.000Z`);
  const due = new Date(`${dueDate}T00:00:00.000Z`);
  if (Number.isNaN(issue.getTime()) || Number.isNaN(due.getTime())) {
    throw new ValidationError("Enter valid issue and due dates.");
  }
  if (due < issue) {
    throw new ValidationError("Due date cannot be before the issue date.");
  }
  return { issue, due };
}

export function quantityToInput(quantityMinor: bigint): string {
  const formatted = formatMinor(quantityMinor, 4);
  if (!formatted.includes(".")) {
    return formatted;
  }
  return formatted.replace(/0+$/, "").replace(/\.$/, "");
}

export function unitPriceToInput(unitPriceMinor: bigint, exponent: number): string {
  return formatMinor(unitPriceMinor, exponent);
}
