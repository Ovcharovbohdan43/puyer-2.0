import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import type { Plan } from "@prisma/client";

import type { BuilderState } from "@/components/invoice-builder/types";
import { totalsForInvoice } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";
import { PDFGenerationError } from "@/lib/errors";
import { InvoicePdfDocument } from "@/lib/pdf/document";
import { shouldBrandPdf } from "@/lib/pdf/public-view";
import type { PaperSize } from "@/lib/pdf/paper";
import { t } from "@/lib/i18n";

export async function renderInvoicePdfBuffer(
  state: BuilderState,
  paper: PaperSize,
  plan: Plan = "FREE",
): Promise<Buffer> {
  const currency = getCurrency(state.currency);
  const totals = totalsForInvoice(
    state.items,
    currency.exponent,
    state.discountType,
    state.discountValue,
    state.taxRate,
  );
  try {
    const buffer = await renderToBuffer(
      <InvoicePdfDocument
        state={state}
        currency={currency}
        totals={totals}
        paper={paper}
        branded={shouldBrandPdf(state.template, plan)}
        madeWith={t("builder").madeWithPuyer}
      />,
    );
    if (!buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) {
      throw new PDFGenerationError();
    }
    return buffer;
  } catch (error) {
    if (error instanceof PDFGenerationError) {
      throw error;
    }
    throw new PDFGenerationError();
  }
}
