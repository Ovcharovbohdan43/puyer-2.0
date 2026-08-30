import type { ClientListRow } from "@/lib/clients/list-view";
import { formatUsdLike, type InvoiceListRow } from "@/lib/invoices/list-view";

const OPEN: ReadonlySet<InvoiceListRow["displayStatus"]> = new Set([
  "OVERDUE",
  "READY",
  "SENT",
  "VIEWED",
  "PARTIALLY_PAID",
]);

export type InvoiceExportLabels = {
  invoice: string;
  client: string;
  date: string;
  due: string;
  amount: string;
  currency: string;
  status: string;
};

export type ClientExportLabels = {
  client: string;
  email: string;
  phone: string;
  address: string;
  tax: string;
  outstanding: string;
  lastInvoice: string;
  invoices: string;
  status: string;
  notes: string;
  added: string;
};

export type ReportExportLabels = {
  period: string;
  currency: string;
  issued: string;
  paid: string;
  outstanding: string;
  overdue: string;
  invoices: InvoiceExportLabels;
};

function dominantCurrency(rows: readonly InvoiceListRow[]): string {
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

export function periodTotals(rows: readonly InvoiceListRow[]): {
  currency: string;
  issuedCount: number;
  paid: string;
  paidCount: number;
  outstanding: string;
  outstandingCount: number;
  overdue: string;
  overdueCount: number;
} {
  const currency = dominantCurrency(rows);
  const scoped = rows.filter((row) => row.currency === currency);
  const paid = scoped.filter((row) => row.displayStatus === "PAID");
  const outstanding = scoped.filter((row) => OPEN.has(row.displayStatus));
  const overdue = scoped.filter((row) => row.displayStatus === "OVERDUE");
  const sum = (list: InvoiceListRow[]) => list.reduce((total, row) => total + BigInt(row.totalMinor), 0n);
  return {
    currency,
    issuedCount: scoped.length,
    paid: formatUsdLike(sum(paid), currency),
    paidCount: paid.length,
    outstanding: formatUsdLike(sum(outstanding), currency),
    outstandingCount: outstanding.length,
    overdue: formatUsdLike(sum(overdue), currency),
    overdueCount: overdue.length,
  };
}

export function invoiceExportRows(rows: readonly InvoiceListRow[], labels: InvoiceExportLabels): string[][] {
  return [
    [labels.invoice, labels.client, labels.date, labels.due, labels.amount, labels.currency, labels.status],
    ...rows.map((row) => [
      row.invoiceNumber,
      row.clientName,
      row.date,
      row.dueDate,
      row.amount,
      row.currency,
      row.displayStatus,
    ]),
  ];
}

export function clientExportRows(rows: readonly ClientListRow[], labels: ClientExportLabels): string[][] {
  return [
    [
      labels.client,
      labels.email,
      labels.phone,
      labels.address,
      labels.tax,
      labels.outstanding,
      labels.lastInvoice,
      labels.invoices,
      labels.status,
      labels.notes,
      labels.added,
    ],
    ...rows.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.address,
      row.taxNumber,
      row.outstanding,
      row.lastInvoiceDate ?? "",
      String(row.invoiceCount),
      row.status,
      row.notes,
      row.createdAt,
    ]),
  ];
}

export function periodReportRows(
  invoices: readonly InvoiceListRow[],
  from: string,
  to: string,
  labels: ReportExportLabels,
): string[][] {
  const totals = periodTotals(invoices);
  return [
    [labels.period, from, to],
    [labels.currency, totals.currency],
    [labels.issued, String(totals.issuedCount)],
    [labels.paid, totals.paid, String(totals.paidCount)],
    [labels.outstanding, totals.outstanding, String(totals.outstandingCount)],
    [labels.overdue, totals.overdue, String(totals.overdueCount)],
    [],
    ...invoiceExportRows(invoices, labels.invoices),
  ];
}
