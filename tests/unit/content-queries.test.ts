import { beforeAll, describe, expect, it } from "vitest";

import {
  findPublishedArticle,
  findArticleTranslation,
  getArticleNavigation,
  getPublishedArticlePreviews,
  getPublishedArticles,
  getPublishedBooks,
  getTagSummaries,
  groupArticlesByYear,
} from "@/lib/content/queries";
import { loadArticles, loadBooks } from "@/lib/content/reader";
import type { Article, Book } from "@/lib/content/types";

describe("content queries", () => {
  let articles: Article[];
  let books: Book[];

  beforeAll(async () => {
    [articles, books] = await Promise.all([loadArticles(), loadBooks()]);
  });

  it("returns pinned and recent published articles first", () => {
    const chineseArticles = getPublishedArticles(articles, "zh-CN");

    expect(chineseArticles).toHaveLength(5);
    expect(chineseArticles[0]?.slug).toBe("cloudflare-pages-nextjs");
    expect(chineseArticles.every((article) => !article.draft)).toBe(true);
  });

  it("groups every article by year and counts tags", () => {
    const chineseArticles = getPublishedArticles(articles, "zh-CN");
    const groups = groupArticlesByYear(chineseArticles);
    const groupedCount = Array.from(groups.values()).flat().length;
    const frontendTag = getTagSummaries(chineseArticles).find(
      (tag) => tag.name === "前端",
    );

    expect(groupedCount).toBe(chineseArticles.length);
    expect(groups.has("2026")).toBe(true);
    expect(groups.has("2025")).toBe(true);
    expect(frontendTag?.count).toBe(2);
  });

  it("finds an explicit translation and orders books", () => {
    const source = articles.find(
      (article) => article.slug === "cloudflare-pages-nextjs",
    );
    expect(source).toBeDefined();

    const translation = findArticleTranslation(articles, source!, "en");
    expect(translation?.slug).toBe("pages-field-notes");
    expect(getPublishedBooks(books, "zh-CN").map((book) => book.slug)).toEqual([
      "ai-engineering",
      "indie-builder-notes",
    ]);
  });

  it("builds lightweight previews and adjacent article links", () => {
    const article = findPublishedArticle(
      articles,
      "zh-CN",
      "blog-search-design",
    );
    expect(article).not.toBeNull();

    const previews = getPublishedArticlePreviews(articles, "zh-CN");
    const navigation = getArticleNavigation(articles, article!);

    expect(previews).toHaveLength(5);
    expect(previews[0]).not.toHaveProperty("body");
    expect(navigation.previous?.slug).toBe("cloudflare-pages-nextjs");
    expect(navigation.next?.slug).toBe("ai-writing-workflow");
  });
});
