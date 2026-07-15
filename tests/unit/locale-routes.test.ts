import { beforeAll, describe, expect, it } from "vitest";

import { buildContentLocaleRoutes } from "@/lib/content/locale-routes";
import { loadArticles, loadBooks } from "@/lib/content/reader";
import type { Article, Book } from "@/lib/content/types";
import { getLocaleSwitchPath } from "@/lib/i18n";

describe("content locale routes", () => {
  let articles: Article[];
  let books: Book[];

  beforeAll(async () => {
    [articles, books] = await Promise.all([loadArticles(), loadBooks()]);
  });

  it("maps translated articles and books in both directions", () => {
    const routes = buildContentLocaleRoutes(articles, books);

    expect(routes["/posts/ai-agent-深度学习指南/"]).toBe(
      "/en/posts/ai-agent-deep-learning-guide/",
    );
    expect(routes["/en/posts/ai-agent-deep-learning-guide/"]).toBe(
      "/posts/ai-agent-深度学习指南/",
    );
    expect(
      getLocaleSwitchPath(
        "/posts/ai-agent-%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0%E6%8C%87%E5%8D%97/",
        "en",
        routes,
      ),
    ).toBe("/en/posts/ai-agent-deep-learning-guide/");
    expect(routes["/books/ai-engineering/"]).toBe("/en/books/ai-engineering/");
  });

  it("falls back to the target home when a translation is missing", () => {
    const routes = buildContentLocaleRoutes(articles, books);

    expect(routes["/posts/从-prompt-到-subagent-ai-工程化学习路线/"]).toBe(
      "/en/",
    );
    expect(routes["/books/indie-builder-notes/"]).toBe("/en/");
    expect(getLocaleSwitchPath("/tags/前端/", "en", routes)).toBe("/en/");
  });
});
