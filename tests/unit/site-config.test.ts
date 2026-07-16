import { describe, expect, it } from "vitest";

import {
  getLocalizedSiteConfig,
  resolveSiteUrl,
  siteConfig,
  supportedLocales,
} from "../../lib/site-config";

describe("site configuration", () => {
  it("keeps the default locale inside the supported locale list", () => {
    expect(supportedLocales).toContain(siteConfig.defaultLocale);
  });

  it("provides complete localized identity values", () => {
    expect(getLocalizedSiteConfig("zh-CN")).toMatchObject({
      authorName: "叶桐",
      description: siteConfig.brand.description["zh-CN"],
      name: "潮思Chaosyn",
      sectionDescriptions: {
        links: siteConfig.sectionDescriptions.links["zh-CN"],
      },
    });
    expect(getLocalizedSiteConfig("en")).toMatchObject({
      authorName: "Yeton",
      description: siteConfig.brand.description.en,
      name: "Chaosyn",
    });
  });

  it("keeps the current integration switches explicit", () => {
    expect(siteConfig.integrations.advertising.placements.article.enabled).toBe(
      true,
    );
    expect(siteConfig.integrations.advertising.placements.home.enabled).toBe(
      false,
    );
    expect(siteConfig.integrations.advertising.placements.posts.enabled).toBe(
      false,
    );
    expect(siteConfig.integrations.aiSearch.enabled).toBe(true);
    expect(siteConfig.integrations.aiSearch.rateLimit).toEqual({
      globalRequests: 30,
      userRequests: 6,
      windowSeconds: 60,
    });
    expect(siteConfig.integrations.analytics.enabled).toBe(true);
    expect(siteConfig.integrations.analytics.showPageViews).toBe(true);
    expect(siteConfig.integrations.comments.enabled).toBe(true);
    expect(siteConfig.integrations.googleAnalytics.enabled).toBe(true);
    expect(siteConfig.integrations.sponsorship.enabled).toBe(true);
  });

  it("uses a local URL when the deployment URL is absent", () => {
    expect(resolveSiteUrl(undefined).href).toBe("http://localhost:3000/");
  });

  it("rejects protocols that cannot be used as a public site URL", () => {
    expect(() => resolveSiteUrl("file:///tmp/blog")).toThrow(
      "NEXT_PUBLIC_SITE_URL must use http or https.",
    );
  });
});
