import type { Invoice, InvoiceItem, InvoiceTemplate, Plan } from "@prisma/client";

import type { BuilderState } from "@/components/invoice-builder/types";
import { emptyBankTransfer, hasBankTransfer, paymentChannelFromStoredBank, splitPaymentDetails } from "@/lib/invoices/bank-transfer";
import { invoiceToBuilderState } from "@/lib/invoices/builder-state";

export type PublicInvoiceView = {
  publicId: string;
  invoiceNumber: string;
  currency: string;
  businessName: string;
  businessAddress: string;
  clientName: string;
  clientAddress: string;
  discountType: BuilderState["discountType"];
  discountValue: string;
  taxRate: string;
  notes: string;
  paymentDetails: string;
  template: InvoiceTemplate;
  accentColor: string;
  logoUrl: string;
  logoScale: number;
  issueDate: string;
  dueDate: string;
  items: Array<{
    line: number;
    description: string;
    quantity: string;
    unitPrice: string;
  }>;
};

const FORBIDDEN_KEYS = [
  "organizationId",
  "clientId",
  "createdByUserId",
  "id",
  "stripe",
  "userId",
] as const;

export function toPublicInvoiceView(
  invoice: Invoice & { items: InvoiceItem[] },
): PublicInvoiceView {
  const state = invoiceToBuilderState(invoice);
  return {
    publicId: invoice.publicId,
    invoiceNumber: invoice.invoiceNumber,
    currency: state.currency,
    businessName: state.businessName,
    businessAddress: state.businessAddress,
    clientName: state.clientName,
    clientAddress: state.clientAddress,
    discountType: state.discountType,
    discountValue: state.discountValue,
    taxRate: state.taxRate,
    notes: state.notes,
    paymentDetails: invoice.paymentDetails,
    template: state.template,
    accentColor: state.accentColor,
    logoUrl: state.logoUrl,
    logoScale: state.logoScale,
    issueDate: state.issueDate,
    dueDate: state.dueDate,
    items: state.items.map((item, index) => ({
      line: index + 1,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export function publicBuilderState(view: PublicInvoiceView): BuilderState {
  const { bank, extra } = splitPaymentDetails(view.paymentDetails);
  return {
    invoiceNumber: view.invoiceNumber,
    currency: view.currency,
    businessName: view.businessName,
    businessAddress: view.businessAddress,
    clientName: view.clientName,
    clientAddress: view.clientAddress,
    items: view.items.map((item) => ({
      id: String(item.line),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    discountType: view.discountType,
    discountValue: view.discountValue,
    taxRate: view.taxRate,
    notes: view.notes,
    paymentDetails: extra,
    paymentChannel: paymentChannelFromStoredBank(hasBankTransfer(bank)),
    storeBankDetailsConsent: hasBankTransfer(bank),
    ...emptyBankTransfer(),
    ...bank,
    template: view.template,
    accentColor: view.accentColor,
    logoUrl: view.logoUrl,
    logoScale: view.logoScale,
    issueDate: view.issueDate,
    dueDate: view.dueDate,
  };
}

export function leaksInternalIds(payload: unknown): boolean {
  const json = JSON.stringify(payload);
  return FORBIDDEN_KEYS.some((key) => json.includes(`"${key}"`));
}

export function shouldBrandPdf(template: InvoiceTemplate, plan: Plan): boolean {
  if (template === "PREMIUM") {
    return false;
  }
  return template === "MINIMAL" || plan === "FREE";
}
