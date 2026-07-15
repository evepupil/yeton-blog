import { describe, expect, it } from "vitest";

import { decodeTagSegment, getTagHref } from "@/features/tags/tag-links";
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
    expect(stripLocalePrefix("/en/")).toBe("/");
  });

  it("falls back to home when switching unknown dynamic content", () => {
    expect(getLocaleSwitchPath("/posts/a-post/", "en")).toBe("/en/");
    expect(getLocaleSwitchPath("/en/books/a-book/", "zh-CN")).toBe("/");
  });

  it("keeps tag names readable until the router encodes the URL", () => {
    expect(getTagHref("zh-CN", "前端")).toBe("/tags/前端/");
    expect(getTagHref("en", "Product Design")).toBe("/en/tags/Product Design/");
    expect(decodeTagSegment("%E5%89%8D%E7%AB%AF")).toBe("前端");
    expect(decodeTagSegment("Product%20Design")).toBe("Product Design");
  });

  it("marks only the matching navigation section active", () => {
    const englishItems = getNavigationItems("en");
    const postsItem = englishItems.find((item) => item.key === "posts");
    const homeItem = englishItems.find((item) => item.key === "home");

    expect(postsItem).toBeDefined();
    expect(homeItem).toBeDefined();
    expect(isNavigationItemActive("/en/posts/example/", postsItem!.href)).toBe(
      true,
    );
    expect(isNavigationItemActive("/en/posts/example/", homeItem!.href)).toBe(
      false,
    );
  });
});
