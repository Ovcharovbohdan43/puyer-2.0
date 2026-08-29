import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HowItWorks } from "@/components/marketing/how-it-works";

describe("HowItWorks", () => {
  it("renders the three product steps with screenshots", () => {
    const html = renderToStaticMarkup(
      <HowItWorks
        how={{
          title: "From invoice to payment, without the hassle.",
          step1: "Create",
          step2: "Send",
          step3: "Get Paid",
          step1Alt: "Create alt",
          step2Alt: "Send alt",
          step3Alt: "Paid alt",
        }}
      />,
    );

    expect(html).toContain("From invoice to payment, without the hassle.");
    expect(html).toContain("Create");
    expect(html).toContain("Send");
    expect(html).toContain("Get Paid");
    expect(html).toContain("how-create.png");
    expect(html).toContain("how-send.png");
    expect(html).toContain("how-get-paid.png");
    expect(html).toContain("how-steps-line");
    expect(html).toContain("items-center");
    expect(html).toContain("text-center");
  });
});
