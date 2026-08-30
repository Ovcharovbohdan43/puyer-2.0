import { CURRENCIES } from "@/lib/invoices/currencies";

export const COMMON_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Warsaw",
  "Europe/Kyiv",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export function onboardingCurrencyCodes(): string[] {
  return CURRENCIES.map((item) => item.code);
}

export function timezoneChoices(detected: string): string[] {
  const next = new Set<string>(COMMON_TIMEZONES);
  if (detected) {
    next.add(detected);
  }
  return [...next];
}
