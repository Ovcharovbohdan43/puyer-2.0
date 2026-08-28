export type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE";

export type StatusFilter = "ALL" | InvoiceStatus;

export type MockTimelineEvent = {
  titleKey: "paymentReceived" | "invoiceViewed" | "invoiceSent" | "invoiceCreated";
  date: string;
  amount?: string;
  paid?: boolean;
};

export type MockInvoice = {
  id: string;
  client: string;
  date: string;
  dueDate: string;
  amount: string;
  status: InvoiceStatus;
  timeline: MockTimelineEvent[];
};

export const LIST_INVOICES: MockInvoice[] = [
  {
    id: "INV-2024-001",
    client: "Acme Corp",
    date: "Oct 15, 2024",
    dueDate: "Oct 30, 2024",
    amount: "$4,500.00",
    status: "PAID",
    timeline: [
      { titleKey: "paymentReceived", date: "Oct 18, 2024", amount: "+$4,500.00", paid: true },
      { titleKey: "invoiceViewed", date: "Oct 16, 2024" },
      { titleKey: "invoiceSent", date: "Oct 15, 2024" },
      { titleKey: "invoiceCreated", date: "Oct 15, 2024" },
    ],
  },
  {
    id: "INV-2024-002",
    client: "Globex Inc",
    date: "Oct 20, 2024",
    dueDate: "Nov 04, 2024",
    amount: "$1,250.00",
    status: "PENDING",
    timeline: [
      { titleKey: "invoiceViewed", date: "Oct 21, 2024" },
      { titleKey: "invoiceSent", date: "Oct 20, 2024" },
      { titleKey: "invoiceCreated", date: "Oct 20, 2024" },
    ],
  },
  {
    id: "INV-2024-003",
    client: "Soylent Corp",
    date: "Sep 01, 2024",
    dueDate: "Sep 15, 2024",
    amount: "$3,200.00",
    status: "OVERDUE",
    timeline: [
      { titleKey: "invoiceSent", date: "Sep 01, 2024" },
      { titleKey: "invoiceCreated", date: "Sep 01, 2024" },
    ],
  },
  {
    id: "INV-2024-004",
    client: "Initech",
    date: "Oct 25, 2024",
    dueDate: "Nov 09, 2024",
    amount: "$850.00",
    status: "PENDING",
    timeline: [
      { titleKey: "invoiceCreated", date: "Oct 25, 2024" },
    ],
  },
];

export const OVERVIEW_RECENT_INVOICES: MockInvoice[] = [
  {
    id: "INV-2024-089",
    client: "Acme Corp",
    date: "Oct 24, 2024",
    dueDate: "Nov 07, 2024",
    amount: "$4,500.00",
    status: "PENDING",
    timeline: [
      { titleKey: "invoiceSent", date: "Oct 24, 2024" },
      { titleKey: "invoiceCreated", date: "Oct 24, 2024" },
    ],
  },
  {
    id: "INV-2024-088",
    client: "Globex Inc",
    date: "Oct 20, 2024",
    dueDate: "Nov 03, 2024",
    amount: "$1,250.00",
    status: "PAID",
    timeline: [
      { titleKey: "paymentReceived", date: "Oct 22, 2024", amount: "+$1,250.00", paid: true },
      { titleKey: "invoiceViewed", date: "Oct 21, 2024" },
      { titleKey: "invoiceSent", date: "Oct 20, 2024" },
      { titleKey: "invoiceCreated", date: "Oct 20, 2024" },
    ],
  },
  {
    id: "INV-2024-087",
    client: "Stark Industries",
    date: "Oct 15, 2024",
    dueDate: "Oct 29, 2024",
    amount: "$12,000.00",
    status: "PAID",
    timeline: [
      { titleKey: "paymentReceived", date: "Oct 18, 2024", amount: "+$12,000.00", paid: true },
      { titleKey: "invoiceSent", date: "Oct 15, 2024" },
      { titleKey: "invoiceCreated", date: "Oct 15, 2024" },
    ],
  },
];

export const ALL_MOCK_INVOICES: MockInvoice[] = [...LIST_INVOICES, ...OVERVIEW_RECENT_INVOICES];

export function filterInvoices(
  invoices: MockInvoice[],
  query: string,
  status: StatusFilter,
): MockInvoice[] {
  const needle = query.trim().toLowerCase();
  return invoices.filter((invoice) => {
    if (status !== "ALL" && invoice.status !== status) {
      return false;
    }
    if (!needle) {
      return true;
    }
    return invoice.id.toLowerCase().includes(needle) || invoice.client.toLowerCase().includes(needle);
  });
}

export function findInvoice(invoices: MockInvoice[], id: string | null | undefined): MockInvoice | null {
  if (!id) {
    return null;
  }
  return invoices.find((invoice) => invoice.id === id) ?? null;
}

export function nextStatusFilter(current: StatusFilter): StatusFilter {
  const order: StatusFilter[] = ["ALL", "PENDING", "PAID", "OVERDUE"];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length] ?? "ALL";
}
