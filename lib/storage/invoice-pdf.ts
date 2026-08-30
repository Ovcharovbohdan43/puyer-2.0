import "server-only";

import { logger } from "@/lib/observability/logger";
import { tryStorageAdmin } from "@/lib/storage/admin";

export const INVOICE_PDF_BUCKET = "invoice-pdfs";

export function invoicePdfObjectPath(invoiceId: string, paper: string, hash: string): string {
  return `${invoiceId}/${paper.toLowerCase()}/${hash}.pdf`;
}

export async function readStoredInvoicePdf(path: string): Promise<Buffer | null> {
  const admin = tryStorageAdmin();
  if (!admin) {
    return null;
  }
  const { data, error } = await admin.storage.from(INVOICE_PDF_BUCKET).download(path);
  if (error || !data) {
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}

export async function writeStoredInvoicePdf(path: string, buffer: Buffer): Promise<void> {
  const admin = tryStorageAdmin();
  if (!admin) {
    return;
  }
  const { error } = await admin.storage.from(INVOICE_PDF_BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    logger.warn("invoice_pdf_store_failed");
  }
}

export async function deleteStoredInvoicePdfs(invoiceId: string): Promise<void> {
  const admin = tryStorageAdmin();
  if (!admin || !invoiceId) {
    return;
  }
  const { data, error } = await admin.storage.from(INVOICE_PDF_BUCKET).list(invoiceId, { limit: 100 });
  if (error || !data?.length) {
    return;
  }
  const paths = data.flatMap((entry) => {
    if (entry.id && entry.name) {
      return [`${invoiceId}/${entry.name}`];
    }
    return [];
  });
  if (paths.length === 0) {
    return;
  }
  const removed = await admin.storage.from(INVOICE_PDF_BUCKET).remove(paths);
  if (removed.error) {
    logger.warn("invoice_pdf_delete_failed");
  }
}
