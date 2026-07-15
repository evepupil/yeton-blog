import { beforeAll, describe, expect, it } from "vitest";

import { loadArticles } from "@/lib/content/reader";
import { buildSearchDocuments, createSearchIndex } from "@/lib/search/index";
import { searchQueryOptions, tokenizeSearchText } from "@/lib/search/config";
import type { Article } from "@/lib/content/types";

describe("search index", () => {
  let articles: Article[];

  beforeAll(async () => {
    articles = await loadArticles();
  });

  it("tokenizes Chinese characters and normalized English words", () => {
    expect(tokenizeSearchText("博客 Search 设计")).toEqual([
      "博",
      "客",
      "search",
      "设",
      "计",
    ]);
  });

  it("keeps published documents inside the selected locale", () => {
    const chineseDocuments = buildSearchDocuments(articles, "zh-CN");
    const englishDocuments = buildSearchDocuments(articles, "en");

    expect(chineseDocuments).toHaveLength(19);
    expect(englishDocuments).toHaveLength(14);
    expect(
      chineseDocuments.every((document) => document.locale === "zh-CN"),
    ).toBe(true);
    expect(englishDocuments.every((document) => document.locale === "en")).toBe(
      true,
    );
  });

  it("matches title, tags and body text with stored result fields", () => {
    const documents = buildSearchDocuments(articles, "zh-CN");
    const index = createSearchIndex(documents);

    expect(
      index.search("Workers AI 免费额度", searchQueryOptions)[0]?.href,
    ).toBe("/posts/cloudflare-workers-ai-免费额度值多少钱/");
    expect(index.search("Audio Wash Player", searchQueryOptions)[0]?.href).toBe(
      "/posts/我做了一个把-anki-听力和-ai-阅读串起来的小插件-audio-wash-player/",
    );
    expect(index.search("crawl4ai", searchQueryOptions)[0]?.href).toBe(
      "/posts/chromium-1187对应版本的playwright版本/",
    );
  });
});
