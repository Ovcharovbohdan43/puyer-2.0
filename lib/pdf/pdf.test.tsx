import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { createDefaultBuilderState } from "@/components/invoice-builder/types";
import { totalsForInvoice } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";
import { InvoicePdfDocument } from "@/lib/pdf/document";
import { invoicePdfHash } from "@/lib/pdf/hash";
import { parsePaperSize, pdfFileName } from "@/lib/pdf/paper";
import { leaksInternalIds, publicBuilderState, shouldBrandPdf, toPublicInvoiceView } from "@/lib/pdf/public-view";
import { allowAttempt } from "@/lib/rate-limit/memory";
import { RateLimitError, toPublicError } from "@/lib/errors";
import type { Invoice, InvoiceItem } from "@prisma/client";

describe("paper size", () => {
  it("defaults to A4 and accepts LETTER", () => {
    expect(parsePaperSize(null)).toBe("A4");
    expect(parsePaperSize("letter")).toBe("LETTER");
    expect(pdfFileName("INV-2026-0001")).toBe("INV-2026-0001.pdf");
    expect(pdfFileName("../secret")).toBe("..-secret.pdf");
  });
});

describe("public invoice view", () => {
  it("omits tenant and row ids", () => {
    const invoice = {
      id: "11111111-1111-1111-1111-111111111111",
      organizationId: "22222222-2222-2222-2222-222222222222",
      clientId: "33333333-3333-3333-3333-333333333333",
      createdByUserId: "44444444-4444-4444-4444-444444444444",
      publicId: "abcdefghijklmnopqrstuv",
      invoiceNumber: "INV-2026-0001",
      status: "SENT",
      currency: "USD",
      issueDate: new Date("2026-08-01T00:00:00.000Z"),
      dueDate: new Date("2026-08-31T00:00:00.000Z"),
      businessName: "Acme",
      businessAddress: "1 Road",
      clientName: "Beta",
      clientAddress: "2 Ave",
      discountType: "NONE",
      discountValue: "0",
      taxRate: "0",
      notes: "",
      paymentDetails: "",
      template: "PROFESSIONAL",
      accentColor: "#000000",
      subtotalMinor: 100n,
      discountAmountMinor: 0n,
      taxAmountMinor: 0n,
      totalMinor: 100n,
      sentAt: null,
      viewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: "55555555-5555-5555-5555-555555555555",
          invoiceId: "11111111-1111-1111-1111-111111111111",
          productId: null,
          description: "Design",
          quantityMinor: 10000n,
          unitPriceMinor: 100n,
          amountMinor: 100n,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies InvoiceItem,
      ],
    } satisfies Invoice & { items: InvoiceItem[] };

    const view = toPublicInvoiceView(invoice);
    expect(leaksInternalIds(view)).toBe(false);
    expect(JSON.stringify(view)).not.toContain(invoice.organizationId);
    expect(JSON.stringify(view)).not.toContain(invoice.clientId);
    expect(JSON.stringify(view)).not.toContain(invoice.createdByUserId);
    expect(JSON.stringify(view)).not.toContain(invoice.id);
    expect(publicBuilderState(view).items[0]?.id).toBe("1");
    expect(shouldBrandPdf("MINIMAL", "BUSINESS")).toBe(true);
    expect(shouldBrandPdf("PREMIUM", "FREE")).toBe(false);
  });
});

describe("pdf smoke", () => {
  it("renders %PDF for A4 and LETTER templates", async () => {
    const state = createDefaultBuilderState();
    const currency = getCurrency(state.currency);
    const totals = totalsForInvoice(
      state.items,
      currency.exponent,
      state.discountType,
      state.discountValue,
      state.taxRate,
    );
    for (const paper of ["A4", "LETTER"] as const) {
      for (const template of ["MINIMAL", "PROFESSIONAL", "PREMIUM"] as const) {
        const buffer = await renderToBuffer(
          <InvoicePdfDocument
            state={{ ...state, template }}
            currency={currency}
            totals={totals}
            paper={paper}
            branded={template === "MINIMAL"}
            madeWith="Made with Puyer"
          />,
        );
        expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
        expect(invoicePdfHash({ ...state, template }, paper, template === "MINIMAL").length).toBe(32);
      }
    }
  }, 30_000);

  it("embeds Noto Sans for long Cyrillic fields", async () => {
    const long = "п".repeat(80);
    const state = createDefaultBuilderState();
    state.businessAddress = long;
    state.clientName = "Клиент";
    state.clientAddress = long;
    state.items[0] = { ...state.items[0]!, description: long };
    const currency = getCurrency(state.currency);
    const totals = totalsForInvoice(
      state.items,
      currency.exponent,
      state.discountType,
      state.discountValue,
      state.taxRate,
    );
    const buffer = await renderToBuffer(
      <InvoicePdfDocument
        state={state}
        currency={currency}
        totals={totals}
        paper="A4"
        branded={false}
        madeWith="Made with Puyer"
      />,
    );
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.toString("latin1")).toMatch(/NotoSans/i);
  }, 30_000);
});

describe("public rate limit helper", () => {
  it("blocks after the window fills", () => {
    const hits = new Map<string, number[]>();
    expect(allowAttempt(hits, "ip", 1_000, 1_000, 2)).toBe(true);
    expect(allowAttempt(hits, "ip", 1_001, 1_000, 2)).toBe(true);
    expect(allowAttempt(hits, "ip", 1_002, 1_000, 2)).toBe(false);
    expect(toPublicError(new RateLimitError()).status).toBe(429);
  });
});
