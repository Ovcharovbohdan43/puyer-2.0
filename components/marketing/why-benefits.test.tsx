import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WhyBenefits } from "@/components/marketing/why-benefits";

describe("WhyBenefits", () => {
  it("renders copy and loops capability chips", () => {
    const html = renderToStaticMarkup(
      <WhyBenefits
        title="Invoice software that stays out of your way."
        body="Focus on your work."
        items={["No account required", "Unlimited invoices", "Templates", "Live preview", "Multiple currencies"]}
      />,
    );

    expect(html).toContain("Invoice software that stays out of your way.");
    expect(html).toContain("why-chip");
    expect(html.split("No account required").length - 1).toBe(2);
    expect(html).toContain("why-chip-track");
  });
});
