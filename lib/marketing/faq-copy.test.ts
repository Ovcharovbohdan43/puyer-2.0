import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

/**
 * Goal: Landing FAQ matches how Puyer actually works and covers buyer questions.
 * Scenario: A freelancer reads FAQ before signing up.
 * Input: faq.items in messages/en.json.
 * Expected: no “download without account”; Stripe/Pro, client pay, bank, magic link, tax, recurring are covered.
 */
describe("landing FAQ copy", () => {
  const items = t("faq").items;
  const blob = items.map((item) => `${item.q} ${item.a}`).join(" ").toLowerCase();

  it("does not promise PDF download without signing in", () => {
    expect(blob).not.toContain("download invoices without creating an account");
    const account = items.find((item) => item.q.toLowerCase().includes("need an account"));
    expect(account?.a.toLowerCase()).toContain("sign in");
    expect(account?.a.toLowerCase()).toContain("magic link");
  });

  it("answers the questions people ask before they pay", () => {
    const questions = items.map((item) => item.q.toLowerCase());
    const mustAsk = [
      "free, pro, and business",
      "password",
      "transaction fees",
      "client need",
      "without stripe",
      "reminders",
      "team",
      "vat or sales tax",
      "recurring",
    ];
    for (const needle of mustAsk) {
      expect(questions.some((q) => q.includes(needle)), needle).toBe(true);
    }
    expect(blob).toContain("does not hold");
    expect(blob).toContain("pro or business");
  });
});
