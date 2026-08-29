import { describe, expect, it } from "vitest";

import { parseInvoiceTemplate } from "@/lib/invoices/template-layout";

describe("parseInvoiceTemplate", () => {
  it("accepts the three invoice skins", () => {
    expect(parseInvoiceTemplate("MINIMAL")).toBe("MINIMAL");
    expect(parseInvoiceTemplate("PROFESSIONAL")).toBe("PROFESSIONAL");
    expect(parseInvoiceTemplate("PREMIUM")).toBe("PREMIUM");
  });

  it("rejects unknown values", () => {
    expect(parseInvoiceTemplate("fancy")).toBeNull();
    expect(parseInvoiceTemplate(undefined)).toBeNull();
  });
});
