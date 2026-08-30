const CONNECT_COUNTRY_CODES = [
  "AE",
  "AT",
  "AU",
  "BE",
  "BG",
  "BR",
  "CA",
  "CH",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "HK",
  "HR",
  "HU",
  "IE",
  "IL",
  "IN",
  "IT",
  "JP",
  "KR",
  "LT",
  "LV",
  "MX",
  "MY",
  "NL",
  "NO",
  "NZ",
  "PH",
  "PL",
  "PT",
  "RO",
  "SE",
  "SG",
  "SI",
  "SK",
  "TH",
  "UA",
  "US",
  "ZA",
] as const;

export type ConnectCountryCode = (typeof CONNECT_COUNTRY_CODES)[number];

const ALLOWED = new Set<string>(CONNECT_COUNTRY_CODES);

const names = new Intl.DisplayNames(["en"], { type: "region" });

export function parseConnectCountry(raw: unknown, fallback = "US"): ConnectCountryCode {
  const code = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (ALLOWED.has(code)) {
    return code as ConnectCountryCode;
  }
  return fallback as ConnectCountryCode;
}

export function isConnectCountry(raw: unknown): raw is ConnectCountryCode {
  return typeof raw === "string" && ALLOWED.has(raw.trim().toUpperCase());
}

export function countryLabel(code: string): string {
  const upper = code.toUpperCase();
  try {
    return names.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

export function countryChoices(): Array<{ code: ConnectCountryCode; label: string }> {
  return CONNECT_COUNTRY_CODES.map((code) => ({ code, label: countryLabel(code) })).sort((a, b) =>
    a.label.localeCompare(b.label, "en"),
  );
}

export function shouldCreateNewConnectedAccount(
  existing: { stripeConnectedAccountId: string | null; status: string; identityCountry: string | null } | null,
  country: string,
): boolean {
  if (!existing?.stripeConnectedAccountId) {
    return true;
  }
  if (existing.status !== "DISCONNECTED") {
    return false;
  }
  const previous = (existing.identityCountry ?? "US").toUpperCase();
  return previous !== country.toUpperCase();
}
