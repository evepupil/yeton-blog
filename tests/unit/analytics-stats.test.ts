import { describe, expect, it } from "vitest";

import type { ResolvedUmamiConfig } from "@/lib/analytics/config";
import {
  buildUmamiStatsUrl,
  getArticleAnalyticsPaths,
  parseUmamiPageStats,
  parseUmamiShareData,
  sumUmamiPageStats,
} from "@/lib/analytics/stats";

const config: ResolvedUmamiConfig = {
  apiBaseUrl: "https://cloud.umami.is/analytics/us/api/",
  pageViewsEnabled: true,
  scriptUrl: "https://cloud.umami.is/script.js",
  shareApiUrl: "https://cloud.umami.is/analytics/us/api/share/public-share-id",
  shareUrl: "https://cloud.umami.is/share/public-share-id",
  timezone: "Asia/Shanghai",
  websiteId: "526149f7-e7d5-40ac-ae75-50a0c2515abf",
};

describe("Umami article statistics", () => {
  it("validates share and statistics responses", () => {
    expect(
      parseUmamiShareData(
        {
          token: "public-share-token-with-enough-length",
          websiteId: config.websiteId,
        },
        config.websiteId,
      ),
    ).toEqual({
      token: "public-share-token-with-enough-length",
      websiteId: config.websiteId,
    });
    expect(
      parseUmamiPageStats({ pageviews: 12.8, visitors: 5, visits: 7 }),
    ).toEqual({ pageviews: 12, visitors: 5, visits: 7 });
    expect(() =>
      parseUmamiShareData(
        { token: "short", websiteId: config.websiteId },
        config.websiteId,
      ),
    ).toThrow("valid token");
    expect(() =>
      parseUmamiPageStats({ pageviews: -1, visitors: 0, visits: 0 }),
    ).toThrow("non-negative");
  });

  it("builds the current Umami Cloud stats request", () => {
    const url = new URL(
      buildUmamiStatsUrl(config, "/posts/example/", 1_700_000_000_000),
    );

    expect(url.pathname).toBe(
      "/analytics/us/api/websites/526149f7-e7d5-40ac-ae75-50a0c2515abf/stats",
    );
    expect(url.searchParams.get("startAt")).toBe("0");
    expect(url.searchParams.get("endAt")).toBe("1700000000000");
    expect(url.searchParams.get("timezone")).toBe("Asia/Shanghai");
    expect(url.searchParams.get("path")).toBe("eq./posts/example/");
  });

  it("includes legacy article paths so migrated counts remain visible", () => {
    const mappings = [{ from: "old-slug", to: "new-slug" }] as const;

    expect(getArticleAnalyticsPaths("zh-CN", "new-slug", mappings)).toEqual([
      "/posts/new-slug/",
      "/posts/old-slug/",
    ]);
    expect(getArticleAnalyticsPaths("en", "english-slug", mappings)).toEqual([
      "/en/posts/english-slug/",
      "/posts/en/english-slug/",
    ]);
  });

  it("sums current and legacy path totals", () => {
    expect(
      sumUmamiPageStats([
        { pageviews: 3, visitors: 2, visits: 2 },
        { pageviews: 59, visitors: 27, visits: 28 },
      ]),
    ).toEqual({ pageviews: 62, visitors: 29, visits: 30 });
  });
});
