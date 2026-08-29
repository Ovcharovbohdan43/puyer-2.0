import { describe, expect, it } from "vitest";

import {
  computeClientKpis,
  filterClientRows,
  invoicesForClient,
  nextClientFilter,
  presentClientRows,
} from "@/lib/clients/list-view";
import { clientInitials } from "@/lib/dashboard/chrome";
import type { InvoiceListRow } from "@/lib/invoices/list-view";

function invoice(partial: Partial<InvoiceListRow> & Pick<InvoiceListRow, "id" | "clientId" | "displayStatus">): InvoiceListRow {
  return {
    invoiceNumber: "INV-1",
    publicId: "pub",
    clientName: "Acme",
    date: "2026-05-01",
    dueDate: "2026-05-15",
    amount: "$10.00",
    totalMinor: "1000",
    currency: "USD",
    status: partial.displayStatus,
    createdAt: "2026-05-01",
    sentAt: "2026-05-01",
    viewedAt: null,
    paidAt: null,
    ...partial,
  };
}

describe("clientInitials", () => {
  it("uses two letters from a company name", () => {
    expect(clientInitials("Acme Corp")).toBe("AC");
    expect(clientInitials("Globex")).toBe("GL");
    expect(clientInitials("  ")).toBe("CL");
  });
});

describe("presentClientRows", () => {
  it("marks overdue when any related invoice is overdue", () => {
    const rows = presentClientRows(
      [{ id: "c1", name: "Acme", email: "a@x.test", address: "", phone: "", taxNumber: "", notes: "", createdAt: "2026-01-01" }],
      [
        invoice({ id: "i1", clientId: "c1", displayStatus: "OVERDUE", totalMinor: "5000" }),
        invoice({ id: "i2", clientId: "c1", displayStatus: "PAID", totalMinor: "1000" }),
      ],
    );
    expect(rows[0]?.status).toBe("OVERDUE");
    expect(rows[0]?.outstanding).toBe("$50.00");
  });

  it("marks active when invoices exist and none are open", () => {
    const rows = presentClientRows(
      [{ id: "c1", name: "Acme", email: "", address: "", phone: "", taxNumber: "", notes: "", createdAt: "2026-01-01" }],
      [invoice({ id: "i1", clientId: "c1", displayStatus: "PAID" })],
    );
    expect(rows[0]?.status).toBe("ACTIVE");
    expect(rows[0]?.outstanding).toBe("$0.00");
  });
});

describe("filterClientRows and nextClientFilter", () => {
  it("filters by name and status", () => {
    const rows = presentClientRows(
      [
        { id: "c1", name: "Acme", email: "a@x.test", address: "", phone: "", taxNumber: "", notes: "", createdAt: "2026-01-01" },
        { id: "c2", name: "Beta", email: "", address: "", phone: "", taxNumber: "", notes: "", createdAt: "2026-01-01" },
      ],
      [],
    );
    expect(filterClientRows(rows, "acme", "ALL")).toHaveLength(1);
    expect(filterClientRows(rows, "", "NONE")).toHaveLength(2);
  });

  it("filters by phone", () => {
    const rows = presentClientRows(
      [{ id: "c1", name: "Acme", email: "", address: "", phone: "555-0100", taxNumber: "", notes: "", createdAt: "2026-01-01" }],
      [],
    );
    expect(filterClientRows(rows, "555-0100", "ALL")).toHaveLength(1);
  });

  it("cycles the status filter", () => {
    expect(nextClientFilter("ALL")).toBe("ACTIVE");
    expect(nextClientFilter("NONE")).toBe("ALL");
  });
});

describe("computeClientKpis", () => {
  it("counts clients and outstanding", () => {
    const kpis = computeClientKpis([
      {
        id: "c1",
        name: "A",
        email: "",
        address: "",
        phone: "",
        taxNumber: "",
        notes: "",
        createdAt: "2026-01-01",
        outstanding: "$10.00",
        outstandingMinor: "1000",
        lastInvoiceDate: null,
        invoiceCount: 1,
        status: "PENDING",
      },
    ]);
    expect(kpis.total).toBe(1);
    expect(kpis.outstanding).toBe("$10.00");
  });
});

describe("invoicesForClient", () => {
  it("returns newest invoices for one client", () => {
    const history = invoicesForClient(
      [
        invoice({ id: "i1", clientId: "c1", displayStatus: "PAID", date: "2026-01-01", invoiceNumber: "INV-1" }),
        invoice({ id: "i2", clientId: "c1", displayStatus: "SENT", date: "2026-08-01", invoiceNumber: "INV-2" }),
        invoice({ id: "i3", clientId: "c2", displayStatus: "PAID", date: "2026-08-02", invoiceNumber: "INV-3" }),
      ],
      "c1",
    );
    expect(history.map((row) => row.id)).toEqual(["i2", "i1"]);
  });
});
