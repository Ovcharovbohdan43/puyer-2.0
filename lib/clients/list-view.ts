import type { InvoiceListRow } from "@/lib/invoices/list-view";
import { formatUsdLike } from "@/lib/invoices/list-view";

export type ClientStatusKind = "ACTIVE" | "PENDING" | "OVERDUE" | "NONE";

export type ClientListRow = {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  taxNumber: string;
  notes: string;
  createdAt: string;
  outstanding: string;
  outstandingMinor: string;
  lastInvoiceDate: string | null;
  invoiceCount: number;
  status: ClientStatusKind;
};

export type ClientSource = {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  taxNumber: string;
  notes: string;
  createdAt: string;
};

function isOpen(status: InvoiceListRow["displayStatus"]): boolean {
  return (
    status === "OVERDUE" ||
    status === "READY" ||
    status === "SENT" ||
    status === "VIEWED" ||
    status === "PARTIALLY_PAID"
  );
}

export function presentClientRows(clients: ClientSource[], invoices: InvoiceListRow[]): ClientListRow[] {
  return clients.map((client) => {
    const related = invoices.filter((invoice) => invoice.clientId === client.id);
    const open = related.filter((invoice) => isOpen(invoice.displayStatus));
    const overdue = related.filter((invoice) => invoice.displayStatus === "OVERDUE");
    const last = related
      .map((invoice) => invoice.date)
      .sort()
      .at(-1);
    const outstandingMinor = open.reduce((sum, invoice) => sum + BigInt(invoice.totalMinor), 0n);
    const currency = open[0]?.currency ?? related[0]?.currency ?? "USD";
    let status: ClientStatusKind = "NONE";
    if (overdue.length > 0) {
      status = "OVERDUE";
    } else if (open.length > 0) {
      status = "PENDING";
    } else if (related.length > 0) {
      status = "ACTIVE";
    }
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.address,
      phone: client.phone,
      taxNumber: client.taxNumber,
      notes: client.notes,
      createdAt: client.createdAt,
      outstanding: formatUsdLike(outstandingMinor, currency),
      outstandingMinor: outstandingMinor.toString(),
      lastInvoiceDate: last ?? null,
      invoiceCount: related.length,
      status,
    };
  });
}

export function filterClientRows(
  rows: ClientListRow[],
  query: string,
  status: "ALL" | ClientStatusKind,
): ClientListRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (status !== "ALL" && row.status !== status) {
      return false;
    }
    if (!needle) {
      return true;
    }
    return (
      row.name.toLowerCase().includes(needle) ||
      row.email.toLowerCase().includes(needle) ||
      row.address.toLowerCase().includes(needle) ||
      row.phone.toLowerCase().includes(needle) ||
      row.taxNumber.toLowerCase().includes(needle)
    );
  });
}

export function invoicesForClient(invoices: InvoiceListRow[], clientId: string): InvoiceListRow[] {
  return invoices
    .filter((invoice) => invoice.clientId === clientId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.invoiceNumber.localeCompare(a.invoiceNumber));
}

export function nextClientFilter(current: "ALL" | ClientStatusKind): "ALL" | ClientStatusKind {
  const order: Array<"ALL" | ClientStatusKind> = ["ALL", "ACTIVE", "PENDING", "OVERDUE", "NONE"];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length] ?? "ALL";
}

export function computeClientKpis(rows: ClientListRow[]): {
  total: number;
  outstanding: string;
  overdue: string;
  paidLikeCount: number;
} {
  const outstandingMinor = rows.reduce((sum, row) => sum + BigInt(row.outstandingMinor), 0n);
  const overdueMinor = rows
    .filter((row) => row.status === "OVERDUE")
    .reduce((sum, row) => sum + BigInt(row.outstandingMinor), 0n);
  return {
    total: rows.length,
    outstanding: formatUsdLike(outstandingMinor),
    overdue: formatUsdLike(overdueMinor),
    paidLikeCount: rows.filter((row) => row.status === "ACTIVE").length,
  };
}
