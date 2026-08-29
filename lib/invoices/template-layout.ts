import type { InvoiceTemplate } from "@/components/invoice-builder/types";

export function parseInvoiceTemplate(value: string | undefined | null): InvoiceTemplate | null {
  if (value === "MINIMAL" || value === "PROFESSIONAL" || value === "PREMIUM") {
    return value;
  }
  return null;
}

export const INVOICE_NAVY = "#0B1C30";

export type InvoiceTemplateSkin = {
  zebra: boolean;
  filledTableHead: boolean;
  tableHeadUsesAccent: boolean;
  filledTotalDue: boolean;
  accentStripe: boolean;
  markUsesAccent: boolean;
};

/** Shared document skeleton; templates only change paint, not structure. */
export function invoiceTemplateSkin(template: InvoiceTemplate): InvoiceTemplateSkin {
  if (template === "MINIMAL") {
    return {
      zebra: false,
      filledTableHead: false,
      tableHeadUsesAccent: false,
      filledTotalDue: false,
      accentStripe: false,
      markUsesAccent: false,
    };
  }
  if (template === "PREMIUM") {
    return {
      zebra: true,
      filledTableHead: true,
      tableHeadUsesAccent: true,
      filledTotalDue: true,
      accentStripe: true,
      markUsesAccent: true,
    };
  }
  return {
    zebra: true,
    filledTableHead: true,
    tableHeadUsesAccent: false,
    filledTotalDue: true,
    accentStripe: false,
    markUsesAccent: true,
  };
}
