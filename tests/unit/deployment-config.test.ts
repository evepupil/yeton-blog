import { describe, expect, it } from "vitest";

import {
  readDeploymentEnvironment,
  resolveProductionSiteUrl,
} from "@/lib/deployment/config";

describe("deployment configuration", () => {
  it("accepts an HTTPS production origin", () => {
    expect(resolveProductionSiteUrl("https://notes.linmo.dev").href).toBe(
      "https://notes.linmo.dev/",
    );
  });

  it.each([
    undefined,
    "http://notes.linmo.dev",
    "https://example.com",
    "https://blog.example.com",
    "https://notes.linmo.dev/blog",
  ])("rejects a non-production site URL: %s", (value) => {
    expect(() => resolveProductionSiteUrl(value)).toThrow();
  });

  it("validates all Cloudflare deployment values without exposing secrets", () => {
    const configuration = readDeploymentEnvironment({
      CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
      CLOUDFLARE_API_TOKEN: "secret-token-value-that-is-long-enough",
      CLOUDFLARE_PAGES_PROJECT: "hero-ui-blog",
      NEXT_PUBLIC_SITE_URL: "https://notes.linmo.dev",
    });

    expect(configuration.pagesProject).toBe("hero-ui-blog");
    expect(configuration.siteUrl.origin).toBe("https://notes.linmo.dev");
  });
});
