import { describe, expect, it } from "vitest";

import { landingTemplateDemoState } from "@/lib/invoices/template-demo";

describe("landing template demo invoices", () => {
  it("uses the live builder sample with a distinct look per template", () => {
    const minimal = landingTemplateDemoState("MINIMAL");
    const professional = landingTemplateDemoState("PROFESSIONAL");
    const premium = landingTemplateDemoState("PREMIUM");

    expect(minimal.template).toBe("MINIMAL");
    expect(professional.template).toBe("PROFESSIONAL");
    expect(premium.template).toBe("PREMIUM");
    expect(minimal.accentColor).toBe("#000000");
    expect(professional.accentColor).toBe("#006c49");
    expect(premium.accentColor).toBe("#006c49");
    expect(minimal.items.length).toBeGreaterThan(0);
    expect(minimal.businessName).toBe(professional.businessName);
  });
});
