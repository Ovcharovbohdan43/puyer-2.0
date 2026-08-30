import { describe, expect, it } from "vitest";

import { canCollectInvoiceStripePayments } from "@/lib/stripe/connect/status";

describe("canCollectInvoiceStripePayments", () => {
  it("is true only when the connected account can charge", () => {
    expect(canCollectInvoiceStripePayments("CONNECTED", true)).toBe(true);
    expect(canCollectInvoiceStripePayments("CONNECTED", false)).toBe(false);
    expect(canCollectInvoiceStripePayments("NOT_CONNECTED", true)).toBe(false);
    expect(canCollectInvoiceStripePayments("ACTION_REQUIRED", true)).toBe(false);
  });
});
