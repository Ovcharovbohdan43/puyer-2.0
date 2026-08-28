import type { InvoiceItem, InvoiceTemplate } from "@prisma/client";

import type { BuilderState } from "@/components/invoice-builder/types";
import { getCurrency } from "@/lib/invoices/currencies";
import { quantityToInput, unitPriceToInput } from "@/lib/invoices/compute";
import type { DiscountType } from "@/lib/invoices/calculate";

type InvoiceLike = {
  invoiceNumber: string;
  currency: string;
  businessName: string;
  businessAddress: string;
  clientName: string;
  clientAddress: string;
  discountType: DiscountType;
  discountValue: string;
  taxRate: string;
  notes: string;
  paymentDetails: string;
  template: InvoiceTemplate;
  accentColor: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
};

export function invoiceToBuilderState(invoice: InvoiceLike): BuilderState {
  const currency = getCurrency(invoice.currency);
  return {
    invoiceNumber: invoice.invoiceNumber,
    currency: currency.code,
    businessName: invoice.businessName,
    businessAddress: invoice.businessAddress,
    clientName: invoice.clientName,
    clientAddress: invoice.clientAddress,
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
    taxRate: invoice.taxRate,
    notes: invoice.notes,
    paymentDetails: invoice.paymentDetails,
    template: invoice.template,
    accentColor: invoice.accentColor,
    issueDate: invoice.issueDate.toISOString().slice(0, 10),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: quantityToInput(item.quantityMinor),
      unitPrice: unitPriceToInput(item.unitPriceMinor, currency.exponent),
    })),
  };
}

export function emptyWorkspaceBuilderState(input: {
  businessName: string;
  businessAddress: string;
  currency: string;
  taxRate: string;
  clientName?: string;
}): BuilderState {
  const today = new Date();
  const due = new Date(today);
  due.setUTCDate(due.getUTCDate() + 30);
  return {
    invoiceNumber: "INV-····",
    currency: input.currency,
    businessName: input.businessName,
    businessAddress: input.businessAddress,
    clientName: input.clientName ?? "",
    clientAddress: "",
    items: [{ id: "1", description: "", quantity: "1", unitPrice: "" }],
    discountType: "NONE",
    discountValue: "0",
    taxRate: input.taxRate || "0",
    notes: "",
    paymentDetails: "",
    template: "PROFESSIONAL",
    accentColor: "#000000",
    issueDate: today.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
  };
}
