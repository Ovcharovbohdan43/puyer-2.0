import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("landing LCP layout", () => {
  it("server-renders the in-viewport Invoice Builder instead of ssr: false", () => {
    const page = readFileSync(join(process.cwd(), "components/marketing/landing-page.tsx"), "utf8");
    expect(page).toContain("InvoiceBuilder");
    expect(page).not.toContain("ssr: false");
    expect(page).not.toContain("LandingInvoiceBuilder");
  });
});

describe("landing template stills", () => {
  it("uses the three Acme invoice images on the templates grid", () => {
    const page = readFileSync(join(process.cwd(), "components/marketing/landing-page.tsx"), "utf8");
    const still = readFileSync(join(process.cwd(), "components/marketing/landing-template-still.tsx"), "utf8");
    expect(page).toContain("LandingTemplateStill");
    expect(still).toContain("/landing/template-minimal.png");
    expect(still).toContain("/landing/template-professional.png");
    expect(still).toContain("/landing/template-premium.png");
    expect(existsSync(join(process.cwd(), "public/landing/template-minimal.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/landing/template-professional.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public/landing/template-premium.png"))).toBe(true);
  });
});
