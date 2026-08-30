import { parseClientCreate } from "@/lib/clients/input";
import { ValidationError } from "@/lib/errors";
import { CURRENCIES } from "@/lib/invoices/currencies";
import { normalizePercentInput } from "@/lib/invoices/validate";

export const ONBOARDING_NAME_MAX = 120;
export const ONBOARDING_ADDRESS_MAX = 500;
export const ONBOARDING_TZ_MAX = 80;

const TIMEZONE_PATTERN = /^[A-Za-z0-9_+\-/]+$/;

export type OnboardingInput = {
  name: string;
  timezone: string;
  businessName: string;
  businessAddress: string;
  currency: string;
  taxRate: string;
  clientName: string;
  clientEmail: string;
};

function clean(raw: unknown, max: number): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.replaceAll("\r\n", "\n").trim().slice(0, max);
}

export function parseOnboardingBody(body: unknown): OnboardingInput {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = clean(record.name, ONBOARDING_NAME_MAX);
  const timezoneRaw = clean(record.timezone, ONBOARDING_TZ_MAX);
  const timezone = timezoneRaw || "UTC";
  const businessName = clean(record.businessName, ONBOARDING_NAME_MAX);
  const businessAddress = clean(record.businessAddress, ONBOARDING_ADDRESS_MAX);
  const currencyRaw = clean(record.currency, 8).toUpperCase();
  const taxRate = normalizePercentInput(typeof record.taxRate === "string" ? record.taxRate : "0");
  const clientName = clean(record.clientName, ONBOARDING_NAME_MAX);
  const clientEmail = typeof record.clientEmail === "string" ? record.clientEmail.trim().toLowerCase() : "";

  if (name.length < 2) {
    throw new ValidationError("Enter your name.");
  }
  if (!TIMEZONE_PATTERN.test(timezone)) {
    throw new ValidationError("Choose a valid timezone.");
  }
  const currency = CURRENCIES.some((item) => item.code === currencyRaw) ? currencyRaw : "";
  if (!currency) {
    throw new ValidationError("Choose a currency.");
  }
  const taxValue = Number(taxRate);
  if (!Number.isFinite(taxValue) || taxValue < 0 || taxValue > 100) {
    throw new ValidationError("Enter a tax rate between 0 and 100.");
  }
  if (clientName || clientEmail) {
    parseClientCreate({ name: clientName, email: clientEmail, phone: "", address: "" });
  }

  return {
    name,
    timezone,
    businessName,
    businessAddress,
    currency,
    taxRate,
    clientName,
    clientEmail,
  };
}

export function needsOnboarding(completedAt: Date | null | undefined): boolean {
  return completedAt == null;
}
