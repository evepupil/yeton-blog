import { beforeAll, describe, expect, it } from "vitest";

import {
  findBookTranslation,
  findPublishedBook,
  findPublishedArticle,
  findArticleTranslation,
  getArticleNavigation,
  getPublishedArticlePreviews,
  getPublishedArticles,
  getPublishedArticlesByTag,
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

    expect(chineseArticles).toHaveLength(19);
    expect(chineseArticles[0]?.slug).toBe(
      "从-prompt-到-subagent-ai-工程化学习路线",
    );
    expect(chineseArticles.every((article) => !article.draft)).toBe(true);
  });

  it("groups every article by year and counts tags", () => {
    const chineseArticles = getPublishedArticles(articles, "zh-CN");
    const groups = groupArticlesByYear(chineseArticles);
    const groupedCount = Array.from(groups.values()).flat().length;
    const aiTag = getTagSummaries(chineseArticles).find(
      (tag) => tag.name === "AI",
    );

    expect(groupedCount).toBe(chineseArticles.length);
    expect(groups.has("2026")).toBe(true);
    expect(groups.has("2025")).toBe(true);
    expect(aiTag?.count).toBe(5);
  });

  it("finds an explicit article translation and orders migrated books", () => {
    const source = articles.find(
      (article) => article.slug === "ai-agent-深度学习指南",
    );
    expect(source).toBeDefined();

    const translation = findArticleTranslation(articles, source!, "en");
    expect(translation?.slug).toBe("ai-agent-deep-learning-guide");
    expect(getPublishedBooks(books, "zh-CN").map((book) => book.slug)).toEqual([
      "ai-engineering",
      "claude-code-advanced",
      "tae-kim-japanese-grammar-guide",
    ]);
  });

  it("builds lightweight previews and adjacent article links", () => {
    const article = findPublishedArticle(
      articles,
      "zh-CN",
      "cloudflare-workers-ai-免费额度值多少钱",
    );
    expect(article).not.toBeNull();

    const previews = getPublishedArticlePreviews(articles, "zh-CN");
    const navigation = getArticleNavigation(articles, article!);

    expect(previews).toHaveLength(19);
    expect(previews[0]).not.toHaveProperty("body");
    expect(navigation.previous?.slug).toBe(
      "从-prompt-到-subagent-ai-工程化学习路线",
    );
    expect(navigation.next?.slug).toBe("claude-code里面使用chatgpt的模型教程");
  });

  it("filters tags and leaves single-language books unpaired", () => {
    expect(getPublishedArticlesByTag(articles, "zh-CN", "AI")).toHaveLength(5);

    const book = findPublishedBook(books, "zh-CN", "ai-engineering");
    expect(book).not.toBeNull();
    expect(findBookTranslation(books, book!, "en")).toBeNull();
  });
});
