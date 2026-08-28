import { describe, expect, it } from "vitest";

import { hyphenatePdfWord, wrapPdfText } from "@/lib/pdf/hyphenate";

describe("hyphenatePdfWord", () => {
  it("keeps short words whole", () => {
    expect(hyphenatePdfWord("London")).toEqual(["London"]);
  });

  it("offers a break between every character of a long token", () => {
    const word = "а".repeat(40);
    const parts = hyphenatePdfWord(word);
    expect(parts.join("")).toBe(word);
    expect(parts.length).toBeGreaterThan(word.length);
  });
});

describe("wrapPdfText", () => {
  it("inserts zero-width spaces into long unbreakable runs", () => {
    const token = "п".repeat(24);
    const wrapped = wrapPdfText(token);
    expect(wrapped.includes("\u200B")).toBe(true);
    expect(wrapped.replaceAll("\u200B", "")).toBe(token);
  });

  it("leaves short words unchanged", () => {
    expect(wrapPdfText("Invoice")).toBe("Invoice");
  });
});
