import { describe, expect, it } from "vitest";

import { calculateReadingMetrics } from "@/lib/content/metrics";

describe("calculateReadingMetrics", () => {
  it("counts Chinese characters and Latin words separately", () => {
    const metrics = calculateReadingMetrics(
      "你好，Cloudflare Pages works well.",
    );

    expect(metrics.chineseCharacters).toBe(2);
    expect(metrics.latinWords).toBe(4);
    expect(metrics.wordCount).toBe(6);
    expect(metrics.readTime).toBe(1);
  });

  it("rounds reading time up and keeps a one-minute minimum", () => {
    expect(calculateReadingMetrics("").readTime).toBe(1);
    expect(calculateReadingMetrics("文".repeat(301)).readTime).toBe(2);
  });
});
