import { describe, expect, it } from "vitest";

import {
  isAllowedRequestOrigin,
  validateAiSearchQuery,
} from "@/lib/ai-search/request";

describe("AI search request validation", () => {
  it("trims a valid query and counts Unicode code points", () => {
    expect(validateAiSearchQuery({ query: "  Cloudflare AI  " }, 20)).toEqual({
      ok: true,
      query: "Cloudflare AI",
    });
    expect(validateAiSearchQuery({ query: "你好呀" }, 3)).toEqual({
      ok: true,
      query: "你好呀",
    });
  });

  it("rejects missing, empty and oversized queries", () => {
    expect(validateAiSearchQuery(null, 10)).toEqual({
      code: "INVALID_REQUEST",
      ok: false,
    });
    expect(validateAiSearchQuery({ query: "   " }, 10)).toEqual({
      code: "QUERY_REQUIRED",
      ok: false,
    });
    expect(validateAiSearchQuery({ query: "1234" }, 3)).toEqual({
      code: "QUERY_TOO_LONG",
      ok: false,
    });
  });

  it("allows same-origin and non-browser requests while rejecting cross-origin requests", () => {
    expect(
      isAllowedRequestOrigin(
        new Request("https://blog.example.com/api/ai-search"),
      ),
    ).toBe(true);
    expect(
      isAllowedRequestOrigin(
        new Request("https://blog.example.com/api/ai-search", {
          headers: { Origin: "https://blog.example.com" },
        }),
      ),
    ).toBe(true);
    expect(
      isAllowedRequestOrigin(
        new Request("https://blog.example.com/api/ai-search", {
          headers: { Origin: "https://other.example.com" },
        }),
      ),
    ).toBe(false);
    expect(
      isAllowedRequestOrigin(
        new Request("https://blog.example.com/api/ai-search", {
          headers: { "Sec-Fetch-Site": "cross-site" },
        }),
      ),
    ).toBe(false);
  });
});
