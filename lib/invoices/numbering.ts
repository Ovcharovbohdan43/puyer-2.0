export function formatInvoiceNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error("Invalid invoice year");
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Invalid invoice sequence");
  }
  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}

export function invoiceYearFromDate(date: Date): number {
  return date.getUTCFullYear();
}
