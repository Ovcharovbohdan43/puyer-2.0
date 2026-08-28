import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InvoicePreview } from "@/components/invoice-builder/invoice-preview";
import { createDefaultBuilderState } from "@/components/invoice-builder/types";
import { totalsForInvoice } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";

describe("InvoicePreview", () => {
  it("keeps the invoice number and wraps a long unbreakable address", () => {
    const state = createDefaultBuilderState();
    state.invoiceNumber = "INV-····";
    state.businessAddress = `авра${"а".repeat(180)}`;
    const currency = getCurrency(state.currency);
    const totals = totalsForInvoice(
      state.items,
      currency.exponent,
      state.discountType,
      state.discountValue,
      state.taxRate,
    );
    const html = renderToStaticMarkup(
      <InvoicePreview state={state} currency={currency} totals={totals} zoom={1} />,
    );

    expect(html).toContain("#INV-····");
    expect(html).toContain("wrap-anywhere");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("max-w-[700px]");
  });
});
