import { describe, expect, it } from "vitest";

import { decodeTagSegment, getTagHref } from "@/features/tags/tag-links";
import { decodePostSlug } from "@/features/posts/post-links";
import {
  getLocalizedPath,
  getLocaleSwitchPath,
  getLocaleFromPath,
  stripLocalePrefix,
} from "../../lib/i18n";
import {
  getNavigationItems,
  isNavigationItemActive,
} from "../../lib/navigation";

describe("localized navigation", () => {
  it("detects the locale from a route prefix", () => {
    expect(getLocaleFromPath("/posts/")).toBe("zh-CN");
    expect(getLocaleFromPath("/en/posts/")).toBe("en");
  });

  it("switches locale without losing the current section", () => {
    expect(getLocalizedPath("/posts/", "en")).toBe("/en/posts/");
    expect(getLocalizedPath("/en/books/", "zh-CN")).toBe("/books/");
    expect(getLocaleSwitchPath("/links/", "en")).toBe("/en/links/");
    expect(getLocalizedPath("/rss.xml", "en")).toBe("/en/rss.xml");
    expect(stripLocalePrefix("/en/")).toBe("/");
  });

  it("falls back to home when switching unknown dynamic content", () => {
    expect(getLocaleSwitchPath("/posts/a-post/", "en")).toBe("/en/");
    expect(getLocaleSwitchPath("/en/books/a-book/", "zh-CN")).toBe("/");
    expect(getLocaleSwitchPath("/books/a-book/a-chapter/", "en")).toBe("/en/");
  });

  it("keeps tag names readable until the router encodes the URL", () => {
    expect(getTagHref("zh-CN", "前端")).toBe("/tags/前端/");
    expect(getTagHref("en", "Product Design")).toBe("/en/tags/Product Design/");
    expect(decodeTagSegment("%E5%89%8D%E7%AB%AF")).toBe("前端");
    expect(decodeTagSegment("Product%20Design")).toBe("Product Design");
  });

  it("decodes legacy Unicode article slugs from dynamic routes", () => {
    expect(
      decodePostSlug("cloudflare-%E9%85%8D%E7%BD%AE%E6%95%99%E7%A8%8B"),
    ).toBe("cloudflare-配置教程");
  });

  it("marks only the matching navigation section active", () => {
    const englishItems = getNavigationItems("en");
    const postsItem = englishItems.find((item) => item.key === "posts");
    const linksItem = englishItems.find((item) => item.key === "links");
    const homeItem = englishItems.find((item) => item.key === "home");

    expect(postsItem).toBeDefined();
    expect(linksItem).toBeDefined();
    expect(homeItem).toBeDefined();
    expect(isNavigationItemActive("/en/posts/example/", postsItem!.href)).toBe(
      true,
    );
    expect(isNavigationItemActive("/en/posts/example/", homeItem!.href)).toBe(
      false,
    );
    expect(isNavigationItemActive("/en/links/", linksItem!.href)).toBe(true);
  });
});
