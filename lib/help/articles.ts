import { t } from "@/lib/i18n";

export type HelpArticle = {
  id: string;
  category: string;
  title: string;
  body: string;
};

export function helpArticles(): HelpArticle[] {
  const help = t("help");
  const faq = t("faq");
  const guides: HelpArticle[] = help.guides.map((guide) => ({
    id: guide.id,
    category: guide.category,
    title: guide.title,
    body: guide.body,
  }));
  const fromFaq: HelpArticle[] = faq.items.map((item, index) => ({
    id: `faq-${index}`,
    category: help.faqCategory,
    title: item.q,
    body: item.a,
  }));
  return [...guides, ...fromFaq];
}

export function helpCategories(articles: HelpArticle[]): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const article of articles) {
    if (seen.has(article.category)) {
      continue;
    }
    seen.add(article.category);
    categories.push(article.category);
  }
  return categories;
}

export function filterHelpArticles(articles: HelpArticle[], query: string): HelpArticle[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return articles;
  }
  return articles.filter((article) => {
    return (
      article.title.toLowerCase().includes(needle) ||
      article.body.toLowerCase().includes(needle) ||
      article.category.toLowerCase().includes(needle)
    );
  });
}
