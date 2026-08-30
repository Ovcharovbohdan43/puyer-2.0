import { describe, expect, it } from "vitest";

import { csvCell, exportFilename, toCsv } from "@/lib/exports/csv";
import { defaultUtcMonthRange, filterByIsoDate, inInclusiveIsoRange, orderedIsoRange } from "@/lib/exports/period";
import { clientExportRows, invoiceExportRows, periodReportRows, periodTotals } from "@/lib/exports/tables";
import type { ClientListRow } from "@/lib/clients/list-view";
import type { InvoiceListRow } from "@/lib/invoices/list-view";

const invoiceLabels = {
  invoice: "Invoice",
  client: "Client",
  date: "Date",
  due: "Due",
  amount: "Amount",
  currency: "Currency",
  status: "Status",
};

function invoice(partial: Partial<InvoiceListRow> & Pick<InvoiceListRow, "id" | "date" | "displayStatus" | "totalMinor" | "currency">): InvoiceListRow {
  return {
    invoiceNumber: "INV-2026-0001",
    publicId: "pub",
    clientId: "c1",
    clientName: "Acme",
    dueDate: "2026-02-01",
    amount: "$10.00",
    status: "SENT",
    createdAt: "2026-01-01",
    sentAt: null,
    viewedAt: null,
    paidAt: null,
    ...partial,
  };
}

describe("csv encoding", () => {
  it("quotes commas and doubles quotes, and prefixes a BOM", () => {
    expect(csvCell('He said "hi"')).toBe('"He said ""hi"""');
    expect(toCsv([["a,b"]])).toBe('\uFEFF"a,b"');
  });

  it("names files from the period or the export day", () => {
    expect(exportFilename("Invoices!", "2026-01-01", "2026-01-31")).toBe("invoices-2026-01-01-2026-01-31.csv");
    expect(exportFilename("clients", undefined, undefined, new Date("2026-08-30T12:00:00.000Z"))).toBe(
      "clients-2026-08-30.csv",
    );
  });
});

describe("period filter", () => {
  it("swaps inverted bounds and includes both ends", () => {
    expect(orderedIsoRange("2026-08-31", "2026-08-01")).toEqual({ from: "2026-08-01", to: "2026-08-31" });
    expect(inInclusiveIsoRange("2026-08-01", "2026-08-01", "2026-08-30")).toBe(true);
    expect(inInclusiveIsoRange("2026-07-31", "2026-08-01", "2026-08-30")).toBe(false);
    expect(filterByIsoDate([{ date: "2026-08-15" }, { date: "2026-09-01" }], (row) => row.date, "2026-08-01", "2026-08-31")).toHaveLength(
      1,
    );
  });

  it("defaults the current UTC month through today", () => {
    expect(defaultUtcMonthRange(new Date("2026-08-30T12:00:00.000Z"))).toEqual({ from: "2026-08-01", to: "2026-08-30" });
  });
});

describe("export tables", () => {
  it("totals a period in the dominant currency without mixing EUR", () => {
    const rows = [
      invoice({ id: "1", date: "2026-08-02", displayStatus: "PAID", totalMinor: "10000", currency: "USD", amount: "$100.00" }),
      invoice({ id: "2", date: "2026-08-03", displayStatus: "OVERDUE", totalMinor: "2500", currency: "USD", amount: "$25.00" }),
      invoice({ id: "3", date: "2026-08-04", displayStatus: "SENT", totalMinor: "99999", currency: "EUR", amount: "€999.99" }),
    ];
    const totals = periodTotals(rows);
    expect(totals.currency).toBe("USD");
    expect(totals.paidCount).toBe(1);
    expect(totals.paid).toBe("$100.00");
    expect(totals.outstandingCount).toBe(1);
    expect(totals.overdueCount).toBe(1);
    expect(periodReportRows(rows, "2026-08-01", "2026-08-30", {
      period: "Period",
      currency: "Currency",
      issued: "Issued",
      paid: "Paid",
      outstanding: "Outstanding",
      overdue: "Overdue",
      invoices: invoiceLabels,
    })[0]).toEqual(["Period", "2026-08-01", "2026-08-30"]);
    expect(invoiceExportRows(rows, invoiceLabels)[0]?.[5]).toBe("Currency");
  });

  it("exports client contact fields", () => {
    const row: ClientListRow = {
      id: "c1",
      name: "Acme",
      email: "a@example.com",
      address: "1 Main",
      phone: "+1",
      taxNumber: "T1",
      notes: "VIP",
      createdAt: "2026-01-01",
      outstanding: "$0.00",
      outstandingMinor: "0",
      lastInvoiceDate: "2026-08-01",
      invoiceCount: 2,
      status: "ACTIVE",
    };
    const csv = clientExportRows([row], {
      client: "Client",
      email: "Email",
      phone: "Phone",
      address: "Address",
      tax: "Tax",
      outstanding: "Outstanding",
      lastInvoice: "Last",
      invoices: "Invoices",
      status: "Status",
      notes: "Notes",
      added: "Added",
    });
    expect(csv[1]).toEqual(["Acme", "a@example.com", "+1", "1 Main", "T1", "$0.00", "2026-08-01", "2", "ACTIVE", "VIP", "2026-01-01"]);
  });
});
