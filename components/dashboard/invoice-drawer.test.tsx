import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined, replace: () => undefined }),
}));

import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import type { InvoiceListRow } from "@/lib/invoices/list-view";

const invoice: InvoiceListRow = {
  id: "i1",
  invoiceNumber: "INV-2026-0001",
  publicId: "pub",
  clientId: "c1",
  clientName: "Acme",
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

describe("InvoiceDrawer", () => {
  it("offers a reminder, status control, and animated timeline", () => {
    const html = renderToStaticMarkup(
      <InvoiceDrawer invoice={invoice} remindersEnabled onClose={() => undefined} />,
    );
    expect(html).toContain("Send reminder");
    expect(html).toContain("Set status");
    expect(html).toContain("puyer-timeline");
    expect(html).toContain("Invoice Created");
    expect(html).toContain("Invoice Sent");
  });
});
