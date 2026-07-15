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
      authorName: "林墨",
      description: siteConfig.brand.description["zh-CN"],
      name: "林墨手记",
    });
    expect(getLocalizedSiteConfig("en")).toMatchObject({
      authorName: "Lin Mo",
      description: siteConfig.brand.description.en,
      name: "Linmo Notes",
    });
  });

  it("keeps unfinished third-party services disabled", () => {
    expect(siteConfig.integrations.adsense.enabled).toBe(false);
    expect(siteConfig.integrations.analytics.enabled).toBe(false);
    expect(siteConfig.integrations.comments.enabled).toBe(false);
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
