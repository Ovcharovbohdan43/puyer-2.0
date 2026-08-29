import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InvoicePreview } from "@/components/invoice-builder/invoice-preview";
import { createDefaultBuilderState } from "@/components/invoice-builder/types";
import { totalsForInvoice } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";
import { invoiceTemplateSkin } from "@/lib/invoices/template-layout";

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
    expect(html).toContain("created with Puyer");
    expect(html).toContain("Invoice details");
    expect(html).toContain("Total due");
    expect(html).toContain("Unit price");
  });

  it("uses the same document skeleton for every template", () => {
    expect(invoiceTemplateSkin("MINIMAL").filledTotalDue).toBe(false);
    expect(invoiceTemplateSkin("PROFESSIONAL").filledTotalDue).toBe(true);
    expect(invoiceTemplateSkin("PREMIUM").accentStripe).toBe(true);
    expect(invoiceTemplateSkin("PREMIUM").tableHeadUsesAccent).toBe(true);

    const state = createDefaultBuilderState();
    state.template = "PREMIUM";
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

    expect(html).toContain("bg-puyer-soft");
    expect(html).toContain("Billed to");
    expect(html).toContain("Payment instructions");
    expect(html).not.toContain("Terms");
    expect(html).not.toContain("F8FAFC");
  });

  it("paints the filled Total due bar with the selected accent", () => {
    const state = createDefaultBuilderState();
    state.template = "PREMIUM";
    state.accentColor = "#7c3aed";
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

    expect(html).toContain("Total due");
    expect(html).toContain("#7c3aed");
    expect(html).not.toContain("#0B1C30");
  });
});
