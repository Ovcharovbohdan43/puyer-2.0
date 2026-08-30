import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PaymentsScreen } from "@/components/dashboard/payments-screen";

describe("PaymentsScreen empty state", () => {
  it("shows the illustration and next steps when there are no payments", () => {
    const html = renderToStaticMarkup(<PaymentsScreen rows={[]} />);
    expect(html).toContain("/app/payments-empty.png");
    expect(html).toContain("No payments yet");
    expect(html).toContain("/invoices/new");
    expect(html).toContain("/settings");
    expect(html).not.toContain("<table");
  });

  it("lists payment rows instead of the empty state", () => {
    const html = renderToStaticMarkup(
      <PaymentsScreen
        rows={[
          {
            id: "pay_1",
            invoiceNumber: "INV-2026-0001",
            invoicePublicId: "pubid",
            clientName: "Acme",
            amount: "$10.00",
            status: "SUCCEEDED",
          },
        ]}
      />,
    );
    expect(html).toContain("INV-2026-0001");
    expect(html).not.toContain("/app/payments-empty.png");
  });
});
