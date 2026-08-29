import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TrustBar } from "@/components/marketing/trust-bar";

describe("TrustBar", () => {
  it("keeps the three trust lines", () => {
    const html = renderToStaticMarkup(
      <TrustBar
        trust={{
          stripe: "Secure payments by Stripe",
          gdpr: "GDPR compliant",
          data: "Your data is protected",
        }}
      />,
    );

    expect(html).toContain("Secure payments by Stripe");
    expect(html).toContain("GDPR compliant");
    expect(html).toContain("Your data is protected");
    expect(html).toContain('id="trust"');
    expect(html).toContain("trust-chip");
  });
});
