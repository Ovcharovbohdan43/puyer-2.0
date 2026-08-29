import { describe, expect, it } from "vitest";

import { filterHelpArticles, helpArticles, helpCategories } from "@/lib/help/articles";

describe("helpArticles", () => {
  it("includes product guides and landing FAQ copy", () => {
    const articles = helpArticles();
    expect(articles.some((article) => article.id === "create-invoice")).toBe(true);
    expect(articles.some((article) => article.title.includes("Do I need an account"))).toBe(true);
    expect(helpCategories(articles).length).toBeGreaterThan(2);
  });

  it("filters by title, body, or category", () => {
    const articles = [
      { id: "a", category: "Billing", title: "Upgrade to Pro", body: "Open Billing in the app." },
      { id: "b", category: "Invoices", title: "Download PDF", body: "Use the invoice drawer." },
    ];
    expect(filterHelpArticles(articles, "pro").map((item) => item.id)).toEqual(["a"]);
    expect(filterHelpArticles(articles, "drawer").map((item) => item.id)).toEqual(["b"]);
    expect(filterHelpArticles(articles, "billing").map((item) => item.id)).toEqual(["a"]);
    expect(filterHelpArticles(articles, "")).toHaveLength(2);
  });
});
