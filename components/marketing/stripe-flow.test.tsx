import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/marketing/public-ctas", () => ({
  OpenAuthButton: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button type="button" className={className}>
      {children}
    </button>
  ),
}));

import { StripeFlow } from "@/components/marketing/stripe-flow";

describe("StripeFlow", () => {
  it("keeps the required payment copy and three-party flow", () => {
    const html = renderToStaticMarkup(
      <StripeFlow
        stripe={{
          title: "Get paid directly through Stripe.",
          customer: "Your Customer",
          stripe: "Stripe",
          business: "Your Business",
          cta: "Connect Stripe",
          note: "Puyer is invoicing software. Payments are processed directly through your connected Stripe account.",
        }}
      />,
    );

    expect(html).toContain("Get paid directly through Stripe.");
    expect(html).toContain("Your Customer");
    expect(html).toContain("Stripe");
    expect(html).toContain("Your Business");
    expect(html).toContain("Connect Stripe");
    expect(html).toContain("Puyer is invoicing software. Payments are processed directly through your connected Stripe account.");
    expect(html).toContain('id="stripe"');
  });
});
