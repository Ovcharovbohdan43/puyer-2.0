import { bankTransferFromState, emptyBankTransfer } from "@/lib/invoices/bank-transfer";
import type { BuilderLine, BuilderState } from "@/components/invoice-builder/types";
import { clampLogoScale, sanitizeStoredLogoUrl } from "@/lib/invoices/logo";
import { parseMajorToMinor, parseQuantity } from "@/lib/invoices/money";
import { getCurrency } from "@/lib/invoices/currencies";

export type LineErrors = {
  description?: string;
  quantity?: string;
  unitPrice?: string;
};

export type BuilderErrors = {
  businessName?: string;
  clientName?: string;
  issueDate?: string;
  dueDate?: string;
  items?: string;
  discount?: string;
  tax?: string;
  paymentChannel?: string;
  lines: Record<string, LineErrors>;
};

export function hasDetailsBuilderErrors(errors: BuilderErrors): boolean {
  if (
    errors.businessName ||
    errors.clientName ||
    errors.issueDate ||
    errors.dueDate ||
    errors.items ||
    errors.discount ||
    errors.tax
  ) {
    return true;
  }
  return Object.values(errors.lines).some((line) => Boolean(line.description || line.quantity || line.unitPrice));
}

export function hasBuilderErrors(errors: BuilderErrors): boolean {
  return Boolean(errors.paymentChannel) || hasDetailsBuilderErrors(errors);
}

/** Accept "20%", "20,5", and ordinary decimals. */
export function normalizePercentInput(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "").replace(/%/g, "").replace(",", ".");
  return trimmed === "" ? "0" : trimmed;
}

export function isBlankBuilderLine(item: BuilderLine): boolean {
  if (item.description.trim()) {
    return false;
  }
  try {
    if (parseMajorToMinor(item.unitPrice || "0", 4) !== 0n) {
      return false;
    }
  } catch {
    return false;
  }
  const qty = item.quantity.trim();
  if (qty === "" || qty === "0") {
    return true;
  }
  try {
    return parseQuantity(qty) === 10_000n;
  } catch {
    return false;
  }
}

export function prepareBuilderState(state: BuilderState): BuilderState {
  const items = state.items.filter((item) => !isBlankBuilderLine(item));
  const bank = bankTransferFromState(state);
  const bankChannel = state.paymentChannel === "BANK";
  const consented = bankChannel && state.storeBankDetailsConsent === true;
  return {
    ...state,
    ...(consented ? bank : emptyBankTransfer()),
    paymentChannel: state.paymentChannel,
    businessName: state.businessName.trim(),
    clientName: state.clientName.trim(),
    taxRate: normalizePercentInput(state.taxRate || "0"),
    discountValue:
      state.discountType === "PERCENT"
        ? normalizePercentInput(state.discountValue || "0")
        : state.discountValue.trim(),
    notes: state.notes.trim(),
    paymentDetails: state.paymentDetails.trim(),
    storeBankDetailsConsent: consented,
    logoUrl: sanitizeStoredLogoUrl(state.logoUrl),
    logoScale: clampLogoScale(state.logoScale),
    items: items.length > 0 ? items : state.items,
  };
}

function isValidPercent(input: string): boolean {
  const value = normalizePercentInput(input);
  if (!/^\d+(\.\d{1,4})?$/.test(value)) {
    return false;
  }
  const [whole, fraction = ""] = value.split(".");
  const scaled = Number(whole) * 10000 + Number((fraction + "0000").slice(0, 4));
  return scaled >= 0 && scaled <= 1_000_000;
}

function readDates(issueDate: string, dueDate: string): { issueOk: boolean; dueOk: boolean; orderOk: boolean } {
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const issueOk = dateRe.test(issueDate);
  const dueOk = dateRe.test(dueDate);
  if (!issueOk || !dueOk) {
    return { issueOk, dueOk, orderOk: true };
  }
  const issue = new Date(`${issueDate}T00:00:00.000Z`);
  const due = new Date(`${dueDate}T00:00:00.000Z`);
  if (Number.isNaN(issue.getTime()) || Number.isNaN(due.getTime())) {
    return { issueOk: !Number.isNaN(issue.getTime()), dueOk: !Number.isNaN(due.getTime()), orderOk: true };
  }
  return { issueOk, dueOk, orderOk: due >= issue };
}

export function validateBuilder(state: BuilderState): BuilderErrors {
  const prepared = prepareBuilderState(state);
  const errors: BuilderErrors = { lines: {} };
  const currency = getCurrency(prepared.currency);
  const lines = prepared.items.filter((item) => !isBlankBuilderLine(item));

  if (!prepared.businessName) {
    errors.businessName = "businessName";
  }
  if (!prepared.clientName) {
    errors.clientName = "clientName";
  }

  const dates = readDates(prepared.issueDate, prepared.dueDate);
  if (!dates.issueOk) {
    errors.issueDate = "issueDate";
  }
  if (!dates.dueOk) {
    errors.dueDate = "dueDate";
  } else if (dates.issueOk && !dates.orderOk) {
    errors.dueDate = "dueDate";
  }

  if (prepared.discountType === "PERCENT" && !isValidPercent(prepared.discountValue || "0")) {
    errors.discount = "discount";
  }
  if (prepared.discountType === "FIXED") {
    try {
      const amount = parseMajorToMinor(prepared.discountValue || "0", currency.exponent);
      if (amount < 0n) {
        errors.discount = "discount";
      }
    } catch {
      errors.discount = "discount";
    }
  }

  if (!isValidPercent(prepared.taxRate || "0")) {
    errors.tax = "tax";
  }

  let validLineCount = 0;
  const toCheck = lines.length > 0 ? lines : state.items.slice(0, 1);
  for (const item of toCheck) {
    const line: LineErrors = {};
    let quantityOk = false;
    let priceOk = false;

    if (!item.description.trim()) {
      line.description = "description";
    }

    try {
      const quantity = parseQuantity(item.quantity);
      if (quantity <= 0n) {
        line.quantity = "quantity";
      } else {
        quantityOk = true;
      }
    } catch {
      line.quantity = "quantity";
    }

    try {
      const price = parseMajorToMinor(item.unitPrice || "0", currency.exponent);
      if (price < 0n) {
        line.unitPrice = "unitPrice";
      } else {
        priceOk = true;
      }
    } catch {
      line.unitPrice = "unitPrice";
    }

    if (line.description || line.quantity || line.unitPrice) {
      errors.lines[item.id] = line;
    } else if (quantityOk && priceOk && item.description.trim()) {
      validLineCount += 1;
    }
  }

  if (validLineCount < 1) {
    errors.items = "items";
  }

  if (prepared.paymentChannel === "UNSET") {
    errors.paymentChannel = "paymentChannel";
  }

  return errors;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
