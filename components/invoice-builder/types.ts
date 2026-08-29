import type { DiscountType } from "@/lib/invoices/calculate";
import { emptyBankTransfer, type BankTransferDetails } from "@/lib/invoices/bank-transfer";

export type InvoiceTemplate = "MINIMAL" | "PROFESSIONAL" | "PREMIUM";

export type BuilderLine = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type BuilderState = {
  invoiceNumber: string;
  currency: string;
  businessName: string;
  businessAddress: string;
  clientName: string;
  clientAddress: string;
  items: BuilderLine[];
  discountType: DiscountType;
  discountValue: string;
  taxRate: string;
  notes: string;
  paymentDetails: string;
  storeBankDetailsConsent: boolean;
  template: InvoiceTemplate;
  accentColor: string;
  issueDate: string;
  dueDate: string;
} & BankTransferDetails;

export const ACCENT_COLORS = ["#000000", "#006c49", "#0070f3", "#7c3aed", "#b45309"] as const;

export function createDefaultBuilderState(): BuilderState {
  return {
    invoiceNumber: "INV-2026-001",
    currency: "USD",
    businessName: "Acme Design Ltd.",
    businessAddress: "88 Market Street\nLondon",
    clientName: "TechNova Inc.",
    clientAddress: "123 Silicon Way\nSan Francisco, CA",
    items: [
      { id: "1", description: "UI Design Phase 1", quantity: "1", unitPrice: "2500.00" },
      { id: "2", description: "Frontend Development", quantity: "40", unitPrice: "100.00" },
    ],
    discountType: "NONE",
    discountValue: "0",
    taxRate: "0",
    notes: "Thank you for your business.",
    paymentDetails: "Payment due within 30 days.",
    storeBankDetailsConsent: false,
    ...emptyBankTransfer(),
    template: "PROFESSIONAL",
    accentColor: "#000000",
    issueDate: "2026-08-27",
    dueDate: "2026-09-26",
  };
}

export function isBuilderDirty(state: BuilderState, baseline: BuilderState): boolean {
  return JSON.stringify(state) !== JSON.stringify(baseline);
}
