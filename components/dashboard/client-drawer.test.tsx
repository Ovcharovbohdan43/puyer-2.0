import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined, replace: () => undefined }),
}));

import { ClientDrawer } from "@/components/dashboard/client-drawer";
import type { ClientListRow } from "@/lib/clients/list-view";
import type { InvoiceListRow } from "@/lib/invoices/list-view";

const client: ClientListRow = {
  id: "c1",
  name: "Acme Corp",
  email: "billing@acme.test",
  address: "pppppppppppppppppppppppppppppppppppppppppppppppppp",
  phone: "555-0100",
  taxNumber: "TAX-9",
  notes: "Net 30",
  createdAt: "2026-01-01",
  outstanding: "$10.00",
  outstandingMinor: "1000",
  lastInvoiceDate: "2026-08-01",
  invoiceCount: 1,
  status: "PENDING",
};

const invoice: InvoiceListRow = {
  id: "i1",
  invoiceNumber: "INV-2026-0001",
  publicId: "pub",
  clientId: "c1",
  clientName: "Acme Corp",
  date: "2026-08-01",
  dueDate: "2026-08-15",
  amount: "$10.00",
  totalMinor: "1000",
  currency: "USD",
  status: "SENT",
  displayStatus: "SENT",
  createdAt: "2026-08-01",
  sentAt: "2026-08-01",
  viewedAt: null,
};

describe("ClientDrawer", () => {
  it("shows contact details and invoice history", () => {
    const html = renderToStaticMarkup(
      <ClientDrawer client={client} invoices={[invoice]} onClose={() => undefined} />,
    );
    expect(html).toContain("Acme Corp");
    expect(html).toContain("billing@acme.test");
    expect(html).toContain("break-all");
    expect(html).toContain("Invoice history");
    expect(html).toContain("INV-2026-0001");
    expect(html).toContain("Create Invoice");
    expect(html).toContain("/invoices?invoice=i1");
    expect(html).toContain("break-all");
  });
});
