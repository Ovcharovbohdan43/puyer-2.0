import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/errors";
import { parseHelpContact, sanitizeHelpText } from "@/lib/help/input";

describe("sanitizeHelpText", () => {
  it("strips control characters and caps length", () => {
    expect(sanitizeHelpText("  hi\u0000 there \r\nnext ", 80)).toBe("hi there \nnext");
    expect(sanitizeHelpText("x".repeat(50), 10)).toBe("x".repeat(10));
  });
});

describe("parseHelpContact", () => {
  it("accepts a complete request", () => {
    const parsed = parseHelpContact({
      name: "  Ada Lovelace ",
      email: "Ada@Puyer.org",
      topic: "invoices",
      message: "I cannot download the PDF for a sent invoice.",
    });
    expect(parsed).toEqual({
      name: "Ada Lovelace",
      email: "ada@puyer.org",
      topic: "INVOICES",
      message: "I cannot download the PDF for a sent invoice.",
    });
  });

  it("rejects missing fields and unknown topics", () => {
    expect(() => parseHelpContact({ email: "ada@puyer.org", topic: "INVOICES", message: "Need help please" })).toThrow(
      ValidationError,
    );
    expect(() =>
      parseHelpContact({ name: "Ada", email: "not-an-email", topic: "INVOICES", message: "Need help please" }),
    ).toThrow(ValidationError);
    expect(() =>
      parseHelpContact({ name: "Ada", email: "ada@puyer.org", topic: "SPAM", message: "Need help please" }),
    ).toThrow(ValidationError);
    expect(() => parseHelpContact({ name: "Ada", email: "ada@puyer.org", topic: "OTHER", message: "short" })).toThrow(
      ValidationError,
    );
  });
});
