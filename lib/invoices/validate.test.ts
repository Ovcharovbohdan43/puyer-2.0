import { describe, expect, it } from "vitest";

import { createDefaultBuilderState } from "@/components/invoice-builder/types";
import { hasBuilderErrors, isValidEmail, prepareBuilderState, validateBuilder } from "@/lib/invoices/validate";

describe("validateBuilder", () => {
  it("accepts the default preview invoice once a payment channel is chosen", () => {
    const state = createDefaultBuilderState();
    state.paymentChannel = "STRIPE";
    const errors = validateBuilder(state);
    expect(hasBuilderErrors(errors)).toBe(false);
  });

  it("requires a payment channel", () => {
    const errors = validateBuilder(createDefaultBuilderState());
    expect(errors.paymentChannel).toBe("paymentChannel");
  });

  it("ignores an extra blank line item", () => {
    const state = createDefaultBuilderState();
    state.paymentChannel = "STRIPE";
    state.items.push({ id: "blank", description: "", quantity: "1", unitPrice: "0.00" });
    expect(hasBuilderErrors(validateBuilder(state))).toBe(false);
  });

  it("accepts a tax rate written as 20%", () => {
    const state = createDefaultBuilderState();
    state.taxRate = "20%";
    expect(validateBuilder(state).tax).toBeUndefined();
  });

  it("rejects due date before issue date", () => {
    const state = createDefaultBuilderState();
    state.issueDate = "2026-09-10";
    state.dueDate = "2026-09-01";
    expect(validateBuilder(state).dueDate).toBe("dueDate");
  });

  it("requires business name, client name, and a valid line", () => {
    const state = createDefaultBuilderState();
    state.businessName = " ";
    state.clientName = "";
    state.items = [{ id: "1", description: "", quantity: "0", unitPrice: "10.00" }];
    const errors = validateBuilder(state);
    expect(errors.businessName).toBe("businessName");
    expect(errors.clientName).toBe("clientName");
    expect(errors.items).toBe("items");
  });

  it("rejects an invalid tax percent", () => {
    const state = createDefaultBuilderState();
    state.taxRate = "abc";
    expect(validateBuilder(state).tax).toBe("tax");
  });

  it("strips bank details from the payload when storage consent is off", () => {
    const state = createDefaultBuilderState();
    state.paymentChannel = "BANK";
    state.bankIban = "DE89370400440532013000";
    state.storeBankDetailsConsent = false;
    const prepared = prepareBuilderState(state);
    expect(prepared.bankIban).toBe("");
    expect(prepared.storeBankDetailsConsent).toBe(false);
  });

  it("drops blob logo URLs so only https logos are stored", () => {
    const state = createDefaultBuilderState();
    state.logoUrl = "blob:https://puyer.org/abc";
    state.logoScale = 12;
    const prepared = prepareBuilderState(state);
    expect(prepared.logoUrl).toBe("");
    expect(prepared.logoScale).toBe(40);
  });

  it("strips bank details when the channel is Stripe", () => {
    const state = createDefaultBuilderState();
    state.paymentChannel = "STRIPE";
    state.bankIban = "DE89370400440532013000";
    state.storeBankDetailsConsent = true;
    const prepared = prepareBuilderState(state);
    expect(prepared.bankIban).toBe("");
    expect(prepared.storeBankDetailsConsent).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts a normal email", () => {
    expect(isValidEmail("alex@puyer.org")).toBe(true);
  });

  it("rejects an incomplete email", () => {
    expect(isValidEmail("alex@puyer")).toBe(false);
  });
});
