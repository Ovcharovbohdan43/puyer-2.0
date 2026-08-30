import type { InvoiceStatus } from "@prisma/client";

const UNPAID: ReadonlySet<InvoiceStatus> = new Set([
  "READY",
  "SENT",
  "VIEWED",
  "PARTIALLY_PAID",
  "OVERDUE",
]);

const EDITABLE: ReadonlySet<InvoiceStatus> = new Set([
  "DRAFT",
  "READY",
  "SENT",
  "VIEWED",
  "OVERDUE",
]);

export const STATUS_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ["READY", "CANCELED"],
  READY: ["DRAFT", "SENT", "VIEWED", "PARTIALLY_PAID", "PAID", "CANCELED"],
  SENT: ["VIEWED", "PARTIALLY_PAID", "PAID", "CANCELED"],
  VIEWED: ["PARTIALLY_PAID", "PAID", "CANCELED"],
  PARTIALLY_PAID: ["PAID", "OVERDUE", "CANCELED"],
  PAID: [],
  OVERDUE: ["PARTIALLY_PAID", "PAID", "CANCELED"],
  CANCELED: [],
};

export function canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function manualStatusOptions(from: InvoiceStatus): InvoiceStatus[] {
  return STATUS_TRANSITIONS[from].filter((status) => status !== "OVERDUE");
}

export function assertTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot change invoice status from ${from} to ${to}`);
  }
}

export function isEditableStatus(status: InvoiceStatus): boolean {
  return EDITABLE.has(status);
}

export function canHardDeleteInvoice(status: InvoiceStatus, hasSucceededPayment: boolean): boolean {
  if (hasSucceededPayment || status === "PAID" || status === "PARTIALLY_PAID") {
    return false;
  }
  return true;
}

export function isUnpaidOpenStatus(status: InvoiceStatus): boolean {
  return UNPAID.has(status);
}

export function displayInvoiceStatus(status: InvoiceStatus, dueDate: Date, now = new Date()): InvoiceStatus {
  if (status === "PAID" || status === "CANCELED" || status === "DRAFT" || status === "PARTIALLY_PAID") {
    return status;
  }
  const due = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate()));
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (isUnpaidOpenStatus(status) && due < today) {
    return "OVERDUE";
  }
  return status;
}

export type ListStatusFilter = "ALL" | "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELED";

export type PublicPayBadge = "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";

export function publicPayBadge(status: InvoiceStatus, dueDate: Date, now = new Date()): PublicPayBadge {
  const display = displayInvoiceStatus(status, dueDate, now);
  if (display === "PAID") {
    return "PAID";
  }
  if (display === "OVERDUE") {
    return "OVERDUE";
  }
  if (display === "PARTIALLY_PAID") {
    return "PARTIAL";
  }
  return "PENDING";
}

export function matchesListFilter(display: InvoiceStatus, filter: ListStatusFilter): boolean {
  if (filter === "ALL") {
    return true;
  }
  if (filter === "PENDING") {
    return display === "READY" || display === "SENT" || display === "VIEWED" || display === "PARTIALLY_PAID";
  }
  return display === filter;
}
