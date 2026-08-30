import { describe, expect, it } from "vitest";

import { createDefaultBuilderState } from "@/components/invoice-builder/types";
import {
  BANK_TRANSFER_HEADING,
  composePaymentDetails,
  emptyBankTransfer,
  hasBankTransfer,
  paymentDetailsForStorage,
  showsInvoiceBankTransfer,
  splitPaymentDetails,
} from "@/lib/invoices/bank-transfer";

describe("bank transfer storage consent", () => {
  it("round-trips labeled bank details and extra instructions", () => {
    const bank = {
      ...emptyBankTransfer(),
      bankAccountHolder: "Acme Design Ltd.",
      bankIban: "GB82 WEST 1234 5698 7654 32",
      bankBic: "WESTGB22",
    };
    const stored = composePaymentDetails(bank, "Payment due within 30 days.");
    expect(stored.startsWith(BANK_TRANSFER_HEADING)).toBe(true);
    const parsed = splitPaymentDetails(stored);
    expect(parsed.bank.bankIban).toBe("GB82 WEST 1234 5698 7654 32");
    expect(parsed.extra).toBe("Payment due within 30 days.");
  });

  it("keeps legacy payment details as extra instructions", () => {
    const parsed = splitPaymentDetails("Payment due within 30 days.");
    expect(hasBankTransfer(parsed.bank)).toBe(false);
    expect(parsed.extra).toBe("Payment due within 30 days.");
  });

  it("does not persist bank fields without explicit consent", () => {
    const state = createDefaultBuilderState();
    state.paymentChannel = "BANK";
    state.bankIban = "DE89370400440532013000";
    state.bankAccountHolder = "Acme";
    state.storeBankDetailsConsent = false;
    expect(paymentDetailsForStorage(state)).toBe("Payment due within 30 days.");
  });

  it("persists bank fields only when consent is true", () => {
    const state = createDefaultBuilderState();
    state.paymentChannel = "BANK";
    state.bankIban = "DE89370400440532013000";
    state.storeBankDetailsConsent = true;
    const stored = paymentDetailsForStorage(state);
    expect(stored).toContain("IBAN: DE89370400440532013000");
    expect(stored).toContain("Payment due within 30 days.");
  });

  it("hides bank details on the invoice until the bank channel is chosen", () => {
    const state = createDefaultBuilderState();
    state.bankIban = "DE89370400440532013000";
    expect(showsInvoiceBankTransfer(state)).toBe(false);
    state.paymentChannel = "BANK";
    expect(showsInvoiceBankTransfer(state)).toBe(true);
  });
});
