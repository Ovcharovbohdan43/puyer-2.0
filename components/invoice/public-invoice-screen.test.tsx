import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PublicInvoiceScreen } from "@/components/invoice/public-invoice-screen";
import { createDefaultBuilderState } from "@/components/invoice-builder/types";
import { totalsForInvoice } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";

describe("public payer screen", () => {
  it("renders the document, pay sidebar, and omits tenant keys", () => {
    const state = createDefaultBuilderState();
    const currency = getCurrency(state.currency);
    const totals = totalsForInvoice(
      state.items,
      currency.exponent,
      state.discountType,
      state.discountValue,
      state.taxRate,
    );
    const html = renderToStaticMarkup(
      <PublicInvoiceScreen
        publicId="abcdefghijklmnopqrstuv"
        state={state}
        currency={currency}
        totals={totals}
        badge="PENDING"
        payable
        connected
        paid={false}
      />,
    );

    expect(html).toContain("payer-portal");
    expect(html).toContain("aria-pressed");
    expect(html).toContain("bg-puyer-card");
    expect(html).toContain("text-puyer-ink");
    expect(html).not.toContain("text-[#0B1C30]");
    expect(html).not.toContain("bg-white");
    expect(html).toContain("#INV-2026-001");
    expect(html).toContain("Pay Invoice");
    expect(html).toContain("Download PDF");
    expect(html).toContain("Securely processed by Stripe");
    expect(html).toContain("created with Puyer");
    expect(html).toContain("/api/public/invoices/abcdefghijklmnopqrstuv/pdf");
    expect(html).not.toContain("organizationId");
    expect(html).not.toContain("clientId");
  });
});
