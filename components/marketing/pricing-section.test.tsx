import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/invoice-builder/builder-session", () => ({
  useBuilderSession: () => ({
    authenticated: false,
    startInvoice: () => undefined,
    requestNavigate: () => undefined,
  }),
}));

import { PricingSection } from "@/components/marketing/pricing-section";

describe("PricingSection", () => {
  it("keeps Free / Pro / Business copy and the interval toggle", () => {
    const html = renderToStaticMarkup(<PricingSection />);

    expect(html).toContain("Simple pricing. No transaction fees.");
    expect(html).toContain("FREE");
    expect(html).toContain("PRO");
    expect(html).toContain("BUSINESS");
    expect(html).toContain("Get Started");
    expect(html).toContain("Subscribe");
    expect(html).toContain("Unlimited Invoices");
    expect(html).toContain("Stripe Integration");
    expect(html).toContain("Multiple Users");
    expect(html).toContain("Monthly");
    expect(html).toContain("Yearly");
    expect(html).toContain("MOST POPULAR");
    expect(html).toContain('id="pricing"');
    expect(html).toContain("pricing-card--featured");
  });
});
