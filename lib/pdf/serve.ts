import "server-only";

import type { Plan } from "@prisma/client";

import type { BuilderState } from "@/components/invoice-builder/types";
import { invoicePdfHash } from "@/lib/pdf/hash";
import type { PaperSize } from "@/lib/pdf/paper";
import { pdfFileName } from "@/lib/pdf/paper";
import { shouldBrandPdf } from "@/lib/pdf/public-view";
import { renderInvoicePdfBuffer } from "@/lib/pdf/render";
import { invoicePdfObjectPath, readStoredInvoicePdf, writeStoredInvoicePdf } from "@/lib/storage/invoice-pdf";

export async function invoicePdfResponsePayload(
  invoiceId: string,
  invoiceNumber: string,
  state: BuilderState,
  paper: PaperSize,
  plan: Plan,
): Promise<{ buffer: Buffer; filename: string }> {
  const branded = shouldBrandPdf(state.template, plan);
  const hash = invoicePdfHash(state, paper, branded);
  const path = invoicePdfObjectPath(invoiceId, paper, hash);
  const cached = await readStoredInvoicePdf(path);
  if (cached) {
    return { buffer: cached, filename: pdfFileName(invoiceNumber) };
  }
  const buffer = await renderInvoicePdfBuffer(state, paper, plan);
  await writeStoredInvoicePdf(path, buffer);
  return { buffer, filename: pdfFileName(invoiceNumber) };
}
