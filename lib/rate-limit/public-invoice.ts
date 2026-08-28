export const PUBLIC_INVOICE_WINDOW_MS = 60_000;
export const PUBLIC_INVOICE_MAX = 60;
export const PUBLIC_PDF_MAX = 20;
export const PUBLIC_PAY_MAX = 10;

export function publicInvoiceLimitKey(ip: string, publicId: string): string {
  return `${ip}:${publicId}`;
}
