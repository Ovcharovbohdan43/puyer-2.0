import { describe, expect, it } from "vitest";

import { INVOICE_PLATFORM_DISCLAIMER } from "@/lib/invoices/disclaimer";

describe("invoice platform disclaimer", () => {
  it("states Puyer is the software used and does not control how it is applied", () => {
    expect(INVOICE_PLATFORM_DISCLAIMER).toContain("created with Puyer");
    expect(INVOICE_PLATFORM_DISCLAIMER).toContain("does not control or endorse how users apply the product");
    expect(INVOICE_PLATFORM_DISCLAIMER.toLowerCase()).not.toContain("never legally responsible");
  });
});
