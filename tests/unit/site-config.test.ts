import { describe, expect, it } from "vitest";

import {
  resolveSiteUrl,
  siteConfig,
  supportedLocales,
} from "../../lib/site-config";

describe("site configuration", () => {
  it("keeps the default locale inside the supported locale list", () => {
    expect(supportedLocales).toContain(siteConfig.defaultLocale);
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
