import type { BuilderState } from "@/components/invoice-builder/types";

export const BANK_TRANSFER_HEADING = "Bank transfer (outside Stripe)";
export const BANK_FIELD_MAX = 200;

export type BankTransferDetails = {
  bankAccountHolder: string;
  bankName: string;
  bankIban: string;
  bankBic: string;
  bankAccountNumber: string;
  bankRoutingNumber: string;
  bankPaymentReference: string;
};

const LABELS: Array<[keyof BankTransferDetails, string]> = [
  ["bankAccountHolder", "Account holder"],
  ["bankName", "Bank name"],
  ["bankIban", "IBAN"],
  ["bankBic", "BIC / SWIFT"],
  ["bankAccountNumber", "Account number"],
  ["bankRoutingNumber", "Routing / sort code"],
  ["bankPaymentReference", "Payment reference"],
];

const LABEL_TO_KEY = new Map(LABELS.map(([key, label]) => [label, key]));

export function emptyBankTransfer(): BankTransferDetails {
  return {
    bankAccountHolder: "",
    bankName: "",
    bankIban: "",
    bankBic: "",
    bankAccountNumber: "",
    bankRoutingNumber: "",
    bankPaymentReference: "",
  };
}

export function clipBankField(value: string): string {
  return value.trim().slice(0, BANK_FIELD_MAX);
}

export function bankTransferFromState(state: BankTransferDetails): BankTransferDetails {
  return {
    bankAccountHolder: clipBankField(state.bankAccountHolder),
    bankName: clipBankField(state.bankName),
    bankIban: clipBankField(state.bankIban),
    bankBic: clipBankField(state.bankBic),
    bankAccountNumber: clipBankField(state.bankAccountNumber),
    bankRoutingNumber: clipBankField(state.bankRoutingNumber),
    bankPaymentReference: clipBankField(state.bankPaymentReference),
  };
}

export function hasBankTransfer(state: BankTransferDetails): boolean {
  const bank = bankTransferFromState(state);
  return LABELS.some(([key]) => bank[key] !== "");
}

export function bankTransferRows(state: BankTransferDetails): Array<{ label: string; value: string }> {
  const bank = bankTransferFromState(state);
  return LABELS.flatMap(([key, label]) => (bank[key] ? [{ label, value: bank[key] }] : []));
}

export function formatBankTransfer(state: BankTransferDetails): string {
  const rows = bankTransferRows(state);
  if (rows.length === 0) {
    return "";
  }
  return [BANK_TRANSFER_HEADING, ...rows.map((row) => `${row.label}: ${row.value}`)].join("\n");
}

export function composePaymentDetails(state: BankTransferDetails, extra: string): string {
  const block = formatBankTransfer(state);
  const instructions = extra.trim();
  if (block && instructions) {
    return `${block}\n\n${instructions}`;
  }
  return block || instructions;
}

export function splitPaymentDetails(raw: string): { bank: BankTransferDetails; extra: string } {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) {
    return { bank: emptyBankTransfer(), extra: "" };
  }
  const lines = text.split("\n");
  if (lines[0]?.trim() !== BANK_TRANSFER_HEADING) {
    return { bank: emptyBankTransfer(), extra: text };
  }
  const bank = emptyBankTransfer();
  let index = 1;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      break;
    }
    const splitAt = line.indexOf(":");
    if (splitAt === -1) {
      break;
    }
    const label = line.slice(0, splitAt).trim();
    const key = LABEL_TO_KEY.get(label);
    if (!key) {
      break;
    }
    bank[key] = clipBankField(line.slice(splitAt + 1));
    index += 1;
  }
  const extra = lines.slice(index).join("\n").trim();
  return { bank, extra };
}

/** Server-side: persist bank details only when the issuer explicitly consents. */
export function paymentDetailsForStorage(state: BuilderState): string {
  const parsed = splitPaymentDetails(state.paymentDetails);
  const fromFields = bankTransferFromState(state);
  const bank = hasBankTransfer(fromFields) ? fromFields : parsed.bank;
  if (state.storeBankDetailsConsent !== true || !hasBankTransfer(bank)) {
    return parsed.extra;
  }
  return composePaymentDetails(bank, parsed.extra);
}
