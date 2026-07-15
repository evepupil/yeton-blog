import { describe, expect, it } from "vitest";

import {
  resolveCloudflareBuildSiteUrl,
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

  it("requires the public URL only inside Cloudflare Pages builds", () => {
    expect(resolveCloudflareBuildSiteUrl({})).toBeNull();
    expect(
      resolveCloudflareBuildSiteUrl({
        CF_PAGES: "1",
        NEXT_PUBLIC_SITE_URL: "https://notes.linmo.dev",
      })?.origin,
    ).toBe("https://notes.linmo.dev");
    expect(() =>
      resolveCloudflareBuildSiteUrl({
        CF_PAGES: "1",
        NEXT_PUBLIC_SITE_URL: "https://example.com",
      }),
    ).toThrow(
      "NEXT_PUBLIC_SITE_URL must use the real public production hostname.",
    );
  });
});
