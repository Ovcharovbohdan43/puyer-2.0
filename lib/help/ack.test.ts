import { afterEach, describe, expect, it } from "vitest";

import { helpAckText, helpCenterUrl, helpTopicLabel } from "@/lib/help/ack";

describe("help ack copy", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });

  it("labels known topics in product English", () => {
    expect(helpTopicLabel("PAYMENTS")).toBe("Invoice payments (Stripe)");
  });

  it("includes reference, topic, and next steps in the confirmation email", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.puyer.org";
    const text = helpAckText({
      name: "Ada",
      requestId: "req-123",
      topic: "INVOICES",
    });
    expect(text).toContain("Hi Ada,");
    expect(text).toContain("Reference: req-123");
    expect(text).toContain("Topic: Invoices and PDF");
    expect(text).toContain("usually within one business day");
    expect(text).toContain("https://www.puyer.org/help");
    expect(helpCenterUrl()).toBe("https://www.puyer.org/help");
  });
});
