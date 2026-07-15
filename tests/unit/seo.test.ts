import { XMLParser } from "fast-xml-parser";
import { beforeAll, describe, expect, it } from "vitest";

import { serializeJsonLd } from "@/components/seo/json-ld";
import {
  findArticleTranslation,
  findPublishedArticle,
} from "@/lib/content/queries";
import { loadArticles, loadBooks } from "@/lib/content/reader";
import type { Article, Book } from "@/lib/content/types";
import {
  buildArticleMetadata,
  buildArticleStructuredData,
} from "@/lib/seo/content-metadata";
import { buildRssFeed } from "@/lib/seo/rss";
import { buildSitemap } from "@/lib/seo/sitemap";

describe("SEO output", () => {
  let articles: Article[];
  let books: Book[];

  beforeAll(async () => {
    [articles, books] = await Promise.all([loadArticles(), loadBooks()]);
  });

  it("builds a locale-specific RSS feed without drafts", () => {
    const source = articles[0];
    expect(source).toBeDefined();
    const draft = { ...source!, draft: true, slug: "hidden-draft" };
    const feed = buildRssFeed([...articles, draft], "zh-CN");
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(feed) as {
      rss: {
        channel: {
          item: Array<{ link: string; title: string }>;
          language: string;
        };
      };
    };

    expect(parsed.rss.channel.language).toBe("zh-CN");
    expect(parsed.rss.channel.item).toHaveLength(19);
    expect(
      parsed.rss.channel.item.some(({ link }) => link.includes("hidden-draft")),
    ).toBe(false);
    expect(feed).toContain('isPermaLink="true"');
  });

  it("includes published routes and translation alternates in the sitemap", () => {
    const source = articles[0];
    expect(source).toBeDefined();
    const draft = { ...source!, draft: true, slug: "hidden-draft" };
    const sitemap = buildSitemap({ articles: [...articles, draft], books });
    const translatedEntry = sitemap.find(({ url }) =>
      url.endsWith(
        "/posts/ai-agent-%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0%E6%8C%87%E5%8D%97/",
      ),
    );

    expect(sitemap.some(({ url }) => url.includes("hidden-draft"))).toBe(false);
    expect(translatedEntry?.alternates?.languages).toMatchObject({
      "zh-CN": expect.stringMatching(/ai-agent-.+\/$/u),
      en: expect.stringMatching(/ai-agent-deep-learning-guide\/$/u),
    });
    expect(sitemap.some(({ url }) => url.endsWith("/en/books/"))).toBe(true);
  });

  it("builds canonical article metadata and safe structured data", () => {
    const article = findPublishedArticle(
      articles,
      "zh-CN",
      "ai-agent-深度学习指南",
    );
    expect(article).not.toBeNull();
    const translation = findArticleTranslation(articles, article!, "en");
    const metadata = buildArticleMetadata(article!, translation);
    const structuredData = buildArticleStructuredData(article!);
    const unsafeJson = serializeJsonLd({ title: "</script>" });

    expect(metadata.alternates?.canonical).toEqual(
      new URL(
        "http://localhost:3000/posts/ai-agent-%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0%E6%8C%87%E5%8D%97/",
      ),
    );
    expect(metadata.openGraph).toMatchObject({ type: "article" });
    expect(structuredData.dateModified).toBe("2026-02-24");
    expect(structuredData.inLanguage).toBe("zh-CN");
    expect(unsafeJson).not.toContain("<");
  });
});
