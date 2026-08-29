import { LEGAL_CONSENT_VERSION } from "@/lib/legal/company";

export const COOKIE_CONSENT_STORAGE_KEY = "puyer-cookie-consent";
export const COOKIE_PREFERENCES_EVENT = "puyer-open-cookie-preferences";

export type CookieCategory = "necessary" | "preferences" | "analytics" | "marketing";

export type CookieConsent = {
  version: number;
  updatedAt: string;
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type CookieInventoryItem = {
  name: string;
  category: CookieCategory;
  purpose: string;
  duration: string;
  storage: "cookie" | "localStorage";
};

export const COOKIE_INVENTORY: CookieInventoryItem[] = [
  {
    name: "Supabase Auth cookies (sb-*-auth-token and related)",
    category: "necessary",
    storage: "cookie",
    duration: "Set by Supabase Auth (session / refresh)",
    purpose:
      "Keep you signed in after the email magic link. HttpOnly, Secure on HTTPS, SameSite=Lax. On puyer.org they are scoped to .puyer.org so apex and www share the session.",
  },
  {
    name: "puyer-auth-return",
    category: "necessary",
    storage: "cookie",
    duration: "10 minutes",
    purpose: "Stores the path to open after magic-link sign-in (for example /dashboard).",
  },
  {
    name: COOKIE_CONSENT_STORAGE_KEY,
    category: "necessary",
    storage: "localStorage",
    duration: "Until you change or clear it",
    purpose: "Remembers your cookie choices so the notice is not shown on every visit.",
  },
  {
    name: "puyer-theme",
    category: "preferences",
    storage: "localStorage",
    duration: "Until you change or clear it",
    purpose:
      "Stores light or dark appearance for surfaces that still honor theme (the public invoice page). Landing, pricing, login, and the dashboard stay light.",
  },
];

export function defaultRejectedConsent(now = new Date()): CookieConsent {
  return {
    version: LEGAL_CONSENT_VERSION,
    updatedAt: now.toISOString(),
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  };
}

export function defaultAcceptedConsent(now = new Date()): CookieConsent {
  return {
    version: LEGAL_CONSENT_VERSION,
    updatedAt: now.toISOString(),
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
  };
}

export function parseCookieConsent(raw: string | null): CookieConsent | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<CookieConsent>;
    if (value.version !== LEGAL_CONSENT_VERSION || value.necessary !== true) {
      return null;
    }
    if (typeof value.updatedAt !== "string" || !value.updatedAt) {
      return null;
    }
    if (
      typeof value.preferences !== "boolean" ||
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean"
    ) {
      return null;
    }
    return {
      version: LEGAL_CONSENT_VERSION,
      updatedAt: value.updatedAt,
      necessary: true,
      preferences: value.preferences,
      analytics: value.analytics,
      marketing: value.marketing,
    };
  } catch {
    return null;
  }
}

export function serializeCookieConsent(consent: CookieConsent): string {
  return JSON.stringify(consent);
}

/** Third-party or measurement scripts must not load until this is true. */
export function analyticsAllowed(consent: CookieConsent | null): boolean {
  return consent?.analytics === true;
}

export function marketingAllowed(consent: CookieConsent | null): boolean {
  return consent?.marketing === true;
}

export function openCookiePreferences() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
}
