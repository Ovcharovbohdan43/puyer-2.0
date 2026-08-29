import { describe, expect, it } from "vitest";

import {
  analyticsAllowed,
  COOKIE_INVENTORY,
  defaultAcceptedConsent,
  defaultRejectedConsent,
  marketingAllowed,
  parseCookieConsent,
  serializeCookieConsent,
} from "@/lib/cookies/consent";
import { LEGAL_CONSENT_VERSION } from "@/lib/legal/company";

describe("cookie consent", () => {
  it("treats missing or invalid storage as no consent", () => {
    expect(parseCookieConsent(null)).toBeNull();
    expect(parseCookieConsent("{")).toBeNull();
    expect(parseCookieConsent(JSON.stringify({ version: 0, necessary: true }))).toBeNull();
  });

  it("round-trips a valid choice", () => {
    const saved = defaultAcceptedConsent(new Date("2026-08-29T10:00:00.000Z"));
    const parsed = parseCookieConsent(serializeCookieConsent(saved));
    expect(parsed).toEqual(saved);
    expect(parsed?.version).toBe(LEGAL_CONSENT_VERSION);
    expect(analyticsAllowed(parsed)).toBe(true);
    expect(marketingAllowed(parsed)).toBe(true);
  });

  it("keeps necessary on when optional categories are rejected", () => {
    const rejected = defaultRejectedConsent();
    expect(rejected.necessary).toBe(true);
    expect(rejected.analytics).toBe(false);
    expect(rejected.marketing).toBe(false);
    expect(analyticsAllowed(rejected)).toBe(false);
  });

  it("lists only first-party storage we actually use", () => {
    const names = COOKIE_INVENTORY.map((item) => item.name).join(" ");
    expect(names).toContain("Supabase Auth");
    expect(names).toContain("puyer-auth-return");
    expect(names).toContain("puyer-theme");
    expect(COOKIE_INVENTORY.every((item) => item.category === "necessary" || item.category === "preferences")).toBe(
      true,
    );
  });
});
