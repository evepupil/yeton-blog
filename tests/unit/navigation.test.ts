import { describe, expect, it } from "vitest";

import {
  getLocalizedPath,
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
