import { describe, expect, it } from "vitest";

import { resolveUmamiConfig } from "@/lib/analytics/config";
import type { UmamiAnalyticsConfig } from "@/site.config";

const enabledConfig: UmamiAnalyticsConfig = {
  baseUrl: "https://analytics.example.com",
  enabled: true,
  provider: "umami",
  shareId: "public-share_1",
  websiteId: "526149f7-e7d5-40ac-ae75-50a0c2515abf",
};

describe("Umami analytics configuration", () => {
  it("resolves the script and public statistics URLs", () => {
    expect(resolveUmamiConfig(enabledConfig)).toEqual({
      scriptUrl: "https://analytics.example.com/script.js",
      shareUrl: "https://analytics.example.com/share/public-share_1",
      websiteId: "526149f7-e7d5-40ac-ae75-50a0c2515abf",
    });
  });

  it("returns null when analytics is disabled", () => {
    expect(resolveUmamiConfig({ ...enabledConfig, enabled: false })).toBeNull();
  });

  it("rejects insecure hosts and malformed public IDs", () => {
    expect(() =>
      resolveUmamiConfig({
        ...enabledConfig,
        baseUrl: "http://analytics.example.com",
      }),
    ).toThrow("must use https");
    expect(() =>
      resolveUmamiConfig({ ...enabledConfig, websiteId: "invalid" }),
    ).toThrow("must be a UUID");
  });
});
