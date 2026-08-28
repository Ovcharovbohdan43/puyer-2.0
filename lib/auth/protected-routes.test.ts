import { describe, expect, it } from "vitest";

import { isProtectedPath, PROTECTED_PREFIXES } from "@/lib/auth/protected-routes";

describe("isProtectedPath", () => {
  it("protects the app shell routes", () => {
    expect(PROTECTED_PREFIXES).toContain("/dashboard");
    expect(PROTECTED_PREFIXES).toContain("/invoices");
    expect(PROTECTED_PREFIXES).toContain("/clients");
    expect(PROTECTED_PREFIXES).toContain("/payments");
    expect(PROTECTED_PREFIXES).toContain("/reports");
    expect(PROTECTED_PREFIXES).toContain("/settings");
    expect(PROTECTED_PREFIXES).toContain("/team");
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/team")).toBe(true);
    expect(isProtectedPath("/invoices?invoice=INV-2024-001".split("?")[0])).toBe(true);
    expect(isProtectedPath("/invoices/new")).toBe(true);
    expect(isProtectedPath("/clients")).toBe(true);
    expect(isProtectedPath("/settings")).toBe(true);
  });

  it("does not protect marketing or public invoice pay pages", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/pricing")).toBe(false);
    expect(isProtectedPath("/invoice/pub_123")).toBe(false);
    expect(isProtectedPath("/auth/callback")).toBe(false);
    expect(isProtectedPath("/invite/" + "ab".repeat(32))).toBe(false);
  });
});
