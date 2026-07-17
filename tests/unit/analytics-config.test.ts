import { describe, expect, it } from "vitest";

import {
  resolveCloudflareWebAnalyticsConfig,
  resolveGoogleAnalyticsConfig,
  resolveUmamiConfig,
} from "@/lib/analytics/config";
import type {
  CloudflareWebAnalyticsConfig,
  GoogleAnalyticsConfig,
  UmamiAnalyticsConfig,
} from "@/site.config";

describe("Cloudflare Web Analytics configuration", () => {
  const config: CloudflareWebAnalyticsConfig = {
    enabled: true,
    token: "34ff13ae70884f10a32cf231fb228bfe",
  };

  it("resolves the migrated beacon token", () => {
    expect(resolveCloudflareWebAnalyticsConfig(config)).toEqual({
      scriptUrl: "https://static.cloudflareinsights.com/beacon.min.js",
      token: "34ff13ae70884f10a32cf231fb228bfe",
    });
  });

  it("omits disabled analytics and rejects malformed tokens", () => {
    expect(
      resolveCloudflareWebAnalyticsConfig({ ...config, enabled: false }),
    ).toBeNull();
    expect(() =>
      resolveCloudflareWebAnalyticsConfig({ ...config, token: "invalid" }),
    ).toThrow("32 hex characters");
  });
});

const enabledConfig: UmamiAnalyticsConfig = {
  apiPath: "/analytics/us/api/",
  baseUrl: "https://analytics.example.com",
  enabled: true,
  provider: "umami",
  shareId: "public-share_1",
  showPageViews: true,
  timezone: "Asia/Shanghai",
  websiteId: "526149f7-e7d5-40ac-ae75-50a0c2515abf",
};

describe("Umami analytics configuration", () => {
  it("resolves the script and public statistics URLs", () => {
    expect(resolveUmamiConfig(enabledConfig)).toEqual({
      apiBaseUrl: "https://analytics.example.com/analytics/us/api/",
      pageViewsEnabled: true,
      scriptUrl: "https://analytics.example.com/script.js",
      shareApiUrl:
        "https://analytics.example.com/analytics/us/api/share/public-share_1",
      shareUrl: "https://analytics.example.com/share/public-share_1",
      timezone: "Asia/Shanghai",
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

  it("requires a share ID when page views are visible", () => {
    expect(() => resolveUmamiConfig({ ...enabledConfig, shareId: "" })).toThrow(
      "shareId is required",
    );
  });
});

describe("Google Analytics configuration", () => {
  const config: GoogleAnalyticsConfig = {
    enabled: true,
    measurementId: "G-D9ZRKT7G85",
  };

  it("resolves an enabled GA4 measurement", () => {
    expect(resolveGoogleAnalyticsConfig(config)).toEqual({
      measurementId: "G-D9ZRKT7G85",
      scriptUrl: "https://www.googletagmanager.com/gtag/js?id=G-D9ZRKT7G85",
    });
  });

  it("omits disabled analytics and rejects malformed IDs", () => {
    expect(
      resolveGoogleAnalyticsConfig({ ...config, enabled: false }),
    ).toBeNull();
    expect(() =>
      resolveGoogleAnalyticsConfig({ ...config, measurementId: "UA-123" }),
    ).toThrow("G- format");
  });
});
