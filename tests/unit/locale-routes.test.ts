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

    expect(routes["/posts/cloudflare-pages-nextjs/"]).toBe(
      "/en/posts/pages-field-notes/",
    );
    expect(routes["/en/posts/pages-field-notes/"]).toBe(
      "/posts/cloudflare-pages-nextjs/",
    );
    expect(routes["/books/ai-engineering/"]).toBe("/en/books/ai-engineering/");
  });

  it("falls back to the target home when a translation is missing", () => {
    const routes = buildContentLocaleRoutes(articles, books);

    expect(routes["/posts/ai-writing-workflow/"]).toBe("/en/");
    expect(routes["/books/indie-builder-notes/"]).toBe("/en/");
    expect(getLocaleSwitchPath("/tags/前端/", "en", routes)).toBe("/en/");
  });
});
