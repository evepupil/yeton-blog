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

  it("maps translated articles in both directions", () => {
    const routes = buildContentLocaleRoutes(articles, books);

    expect(routes["/posts/ai-agent-3114342e/"]).toBe(
      "/en/posts/ai-agent-deep-learning-guide/",
    );
    expect(routes["/en/posts/ai-agent-deep-learning-guide/"]).toBe(
      "/posts/ai-agent-3114342e/",
    );
    expect(getLocaleSwitchPath("/posts/ai-agent-3114342e/", "en", routes)).toBe(
      "/en/posts/ai-agent-deep-learning-guide/",
    );
  });

  it("falls back to the target home when a translation is missing", () => {
    const routes = buildContentLocaleRoutes(articles, books);

    expect(routes["/posts/prompt-subagent-ai-36c4342e/"]).toBe("/en/");
    expect(routes["/books/ai-engineering/"]).toBe("/en/");
    expect(routes["/books/ai-engineering/01-prompt/"]).toBe("/en/");
    expect(routes["/books/tae-kim-japanese-grammar-guide/"]).toBe("/en/");
    expect(getLocaleSwitchPath("/tags/前端/", "en", routes)).toBe("/en/");
  });
});
