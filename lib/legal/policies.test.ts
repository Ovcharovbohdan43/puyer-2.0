import { describe, expect, it } from "vitest";

import { cookiePolicy, privacyPolicy, termsOfService } from "@/lib/legal/policies";

function documentText(doc: { intro: string; sections: { blocks: { type: string; text?: string; items?: string[] }[] }[] }) {
  const parts = [doc.intro];
  for (const section of doc.sections) {
    for (const block of section.blocks) {
      if (block.type === "p" && block.text) {
        parts.push(block.text);
      }
      if (block.type === "ul" && block.items) {
        parts.push(...block.items);
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

describe("legal policies", () => {
  it("does not claim Puyer is never legally responsible", () => {
    const combined = [privacyPolicy, termsOfService, cookiePolicy].map(documentText).join(" ");
    expect(combined).not.toContain("never legally responsible");
  });

  it("describes the invoice payment model", () => {
    const privacy = documentText(privacyPolicy);
    const terms = documentText(termsOfService);
    expect(privacy).toContain("does not hold");
    expect(privacy).toContain("stripe");
    expect(terms).toContain("merchant of record");
    expect(terms).toContain("magic link");
  });

  it("lists processors used by the stack", () => {
    const privacy = documentText(privacyPolicy);
    expect(privacy).toContain("supabase");
    expect(privacy).toContain("resend");
    expect(privacy).toContain("vercel");
  });
});
