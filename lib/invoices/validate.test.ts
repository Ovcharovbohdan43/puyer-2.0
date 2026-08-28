import { describe, expect, it } from "vitest";

import { createDefaultBuilderState } from "@/components/invoice-builder/types";
import { hasBuilderErrors, isValidEmail, validateBuilder } from "@/lib/invoices/validate";

describe("validateBuilder", () => {
  it("accepts the default preview invoice", () => {
    const errors = validateBuilder(createDefaultBuilderState());
    expect(hasBuilderErrors(errors)).toBe(false);
  });

  it("ignores an extra blank line item", () => {
    const state = createDefaultBuilderState();
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
});

describe("isValidEmail", () => {
  it("accepts a normal email", () => {
    expect(isValidEmail("alex@puyer.org")).toBe(true);
  });

  it("rejects an incomplete email", () => {
    expect(isValidEmail("alex@puyer")).toBe(false);
  });
});
