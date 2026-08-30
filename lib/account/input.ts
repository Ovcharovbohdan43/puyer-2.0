import { ONBOARDING_ADDRESS_MAX, ONBOARDING_NAME_MAX, ONBOARDING_TZ_MAX } from "@/lib/onboarding/input";
import { ValidationError } from "@/lib/errors";
import { isValidEmail } from "@/lib/invoices/validate";

export const ACCOUNT_REASON_MIN = 12;
export const ACCOUNT_REASON_MAX = 2000;
export const ACCOUNT_PASSWORD_MIN = 12;
export const ACCOUNT_PASSWORD_MAX = 128;

const TIMEZONE_PATTERN = /^[A-Za-z0-9_+\-/]+$/;

function clean(raw: unknown, max: number): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.replaceAll("\r\n", "\n").trim().slice(0, max);
}

export type AccountProfileInput = {
  name: string;
  timezone: string;
  businessName: string;
  businessAddress: string;
};

export function parseAccountProfileBody(body: unknown, isOwner: boolean): AccountProfileInput {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = clean(record.name, ONBOARDING_NAME_MAX);
  const timezoneRaw = clean(record.timezone, ONBOARDING_TZ_MAX);
  const timezone = timezoneRaw || "UTC";
  const businessName = clean(record.businessName, ONBOARDING_NAME_MAX);
  const businessAddress = clean(record.businessAddress, ONBOARDING_ADDRESS_MAX);

  if (name.length < 2) {
    throw new ValidationError("Enter your name.");
  }
  if (!TIMEZONE_PATTERN.test(timezone)) {
    throw new ValidationError("Choose a valid timezone.");
  }
  if (isOwner && businessName.length < 2) {
    throw new ValidationError("Enter your business name.");
  }

  return { name, timezone, businessName, businessAddress };
}

export function parseAccountEmailBody(body: unknown, currentEmail: string): string {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    throw new ValidationError("Enter a valid email address.");
  }
  if (email === currentEmail.trim().toLowerCase()) {
    throw new ValidationError("That is already your sign-in email.");
  }
  return email;
}

export function parseAccountPasswordBody(body: unknown): { password: string; currentPassword: string } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const password = typeof record.password === "string" ? record.password : "";
  const currentPassword = typeof record.currentPassword === "string" ? record.currentPassword : "";
  if (password.length < ACCOUNT_PASSWORD_MIN || password.length > ACCOUNT_PASSWORD_MAX) {
    throw new ValidationError("Password must be between 12 and 128 characters.");
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ValidationError("Password must include a letter and a number.");
  }
  if (currentPassword && currentPassword === password) {
    throw new ValidationError("Choose a different password.");
  }
  return { password, currentPassword };
}

export function parseDeletionReason(body: unknown): string {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const reason = clean(record.reason, ACCOUNT_REASON_MAX);
  if (reason.length < ACCOUNT_REASON_MIN) {
    throw new ValidationError("Explain why you want to delete the account (at least 12 characters).");
  }
  return reason;
}
