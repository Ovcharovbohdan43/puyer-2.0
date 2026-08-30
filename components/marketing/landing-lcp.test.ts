import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("landing LCP layout", () => {
  it("server-renders the in-viewport Invoice Builder instead of ssr: false", () => {
    const page = readFileSync(join(process.cwd(), "components/marketing/landing-page.tsx"), "utf8");
    expect(page).toContain("InvoiceBuilder");
    expect(page).not.toContain("ssr: false");
    expect(page).not.toContain("LandingInvoiceBuilder");
  });

  it("defers below-the-fold template invoices from a Client Component", () => {
    const source = readFileSync(join(process.cwd(), "components/marketing/landing-template-mockup.tsx"), "utf8");
    expect(source).toMatch(/^"use client";/);
    expect(source).toContain("ssr: false");
  });
});
