export type PaperSize = "A4" | "LETTER";

export function parsePaperSize(value: string | null | undefined): PaperSize {
  return value?.toUpperCase() === "LETTER" ? "LETTER" : "A4";
}

export function pdfFileName(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80);
  return `${safe || "invoice"}.pdf`;
}
