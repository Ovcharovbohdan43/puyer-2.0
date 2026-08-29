import type { InvoiceStatus } from "@prisma/client";

import { getCurrency } from "@/lib/invoices/currencies";
import { formatMoney } from "@/lib/invoices/money";
import { displayInvoiceStatus, matchesListFilter, type ListStatusFilter } from "@/lib/invoices/status";

export type InvoiceListRow = {
  id: string;
  invoiceNumber: string;
  publicId: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  amount: string;
  totalMinor: string;
  currency: string;
  status: InvoiceStatus;
  displayStatus: InvoiceStatus;
  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
};

export type WorkspaceKpis = {
  currency: string;
  revenue: string;
  paidCount: number;
  paid30: string;
  paid30Count: number;
  outstanding: string;
  outstandingCount: number;
  overdue: string;
  overdueCount: number;
};

export type InvoiceListSource = {
  id: string;
  invoiceNumber: string;
  publicId: string;
  clientId: string;
  clientName: string;
  issueDate: Date;
  dueDate: Date;
  totalMinor: bigint;
  currency: string;
  status: InvoiceStatus;
  createdAt: Date;
  sentAt: Date | null;
  viewedAt: Date | null;
};

export function toInvoiceListRow(invoice: InvoiceListSource, now = new Date()): InvoiceListRow {
  const currency = getCurrency(invoice.currency);
  const displayStatus = displayInvoiceStatus(invoice.status, invoice.dueDate, now);
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    publicId: invoice.publicId,
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    date: invoice.issueDate.toISOString().slice(0, 10),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    amount: formatMoney(invoice.totalMinor, currency.symbol, currency.exponent),
    totalMinor: invoice.totalMinor.toString(),
    currency: invoice.currency,
    status: invoice.status,
    displayStatus,
    createdAt: invoice.createdAt.toISOString().slice(0, 10),
    sentAt: invoice.sentAt ? invoice.sentAt.toISOString().slice(0, 10) : null,
    viewedAt: invoice.viewedAt ? invoice.viewedAt.toISOString().slice(0, 10) : null,
  };
}

export function filterInvoiceRows(
  rows: InvoiceListRow[],
  query: string,
  filter: ListStatusFilter,
): InvoiceListRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (!matchesListFilter(row.displayStatus, filter)) {
      return false;
    }
    if (!needle) {
      return true;
    }
    return (
      row.invoiceNumber.toLowerCase().includes(needle) || row.clientName.toLowerCase().includes(needle)
    );
  });
}

export function sumMinor(rows: InvoiceListRow[], predicate: (row: InvoiceListRow) => boolean): bigint {
  return rows.reduce((sum, row) => (predicate(row) ? sum + BigInt(row.totalMinor) : sum), 0n);
}

export function nextListFilter(current: ListStatusFilter): ListStatusFilter {
  const order: ListStatusFilter[] = ["ALL", "PENDING", "PAID", "OVERDUE", "DRAFT", "CANCELED"];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length] ?? "ALL";
}

export function formatUsdLike(minor: bigint, currencyCode = "USD"): string {
  const currency = getCurrency(currencyCode);
  return formatMoney(minor, currency.symbol, currency.exponent);
}

function mostFrequentCurrency(rows: InvoiceListRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.currency, (counts.get(row.currency) ?? 0) + 1);
  }
  let best = "USD";
  let bestCount = -1;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}

export function computeWorkspaceKpis(rows: InvoiceListRow[], now = new Date()): WorkspaceKpis {
  const currency = mostFrequentCurrency(rows);
  const scoped = rows.filter((row) => row.currency === currency);
  const paid = scoped.filter((row) => row.displayStatus === "PAID");
  const outstandingRows = scoped.filter(
    (row) =>
      row.displayStatus === "OVERDUE" ||
      row.displayStatus === "READY" ||
      row.displayStatus === "SENT" ||
      row.displayStatus === "VIEWED" ||
      row.displayStatus === "PARTIALLY_PAID",
  );
  const overdueRows = scoped.filter((row) => row.displayStatus === "OVERDUE");
  const windowMs = 30 * 86_400_000;
  const paid30 = paid.filter((row) => {
    const stamp = Date.parse(`${row.sentAt ?? row.date}T00:00:00.000Z`);
    const delta = now.getTime() - stamp;
    return delta >= 0 && delta <= windowMs;
  });
  return {
    currency,
    revenue: formatUsdLike(sumMinor(paid, () => true), currency),
    paidCount: paid.length,
    paid30: formatUsdLike(sumMinor(paid30, () => true), currency),
    paid30Count: paid30.length,
    outstanding: formatUsdLike(sumMinor(outstandingRows, () => true), currency),
    outstandingCount: outstandingRows.length,
    overdue: formatUsdLike(sumMinor(overdueRows, () => true), currency),
    overdueCount: overdueRows.length,
  };
}
