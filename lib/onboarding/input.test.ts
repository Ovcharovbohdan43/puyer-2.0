import { describe, expect, it } from "vitest";

import { needsOnboarding, parseOnboardingBody } from "@/lib/onboarding/input";

describe("parseOnboardingBody", () => {
  it("accepts required name and currency, leaving optional fields empty", () => {
    const parsed = parseOnboardingBody({
      name: "Ada",
      currency: "eur",
    });
    expect(parsed.name).toBe("Ada");
    expect(parsed.currency).toBe("EUR");
    expect(parsed.taxRate).toBe("0");
    expect(parsed.timezone).toBe("UTC");
    expect(parsed.businessName).toBe("");
  });

  it("rejects a client email without a client name", () => {
    expect(() =>
      parseOnboardingBody({
        name: "Ada",
        currency: "USD",
        clientEmail: "client@puyer.org",
      }),
    ).toThrow("Enter a client name.");
  });

  it("parses an optional first client when both fields are present", () => {
    const parsed = parseOnboardingBody({
      name: "Ada",
      currency: "USD",
      clientName: "Acme",
      clientEmail: "billing@acme.test",
    });
    expect(parsed.clientName).toBe("Acme");
    expect(parsed.clientEmail).toBe("billing@acme.test");
  });
});

describe("needsOnboarding", () => {
  it("is true until a completion timestamp exists", () => {
    expect(needsOnboarding(null)).toBe(true);
    expect(needsOnboarding(new Date("2026-08-30T00:00:00.000Z"))).toBe(false);
  });
});
