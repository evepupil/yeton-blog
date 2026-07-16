import { describe, expect, it } from "vitest";

import {
  createRedirectRules,
  serializeRedirectFile,
} from "@/lib/redirects/generator";
import type { RedirectConfiguration } from "@/lib/redirects/types";
import { redirectsConfig } from "@/redirects.config";

describe("redirect configuration", () => {
  it("expands article mappings for both trailing-slash variants", () => {
    const rules = createRedirectRules({
      paths: [],
      postSlugs: [{ from: "old-slug", to: "new-slug" }],
    });

    expect(rules).toEqual([
      { from: "/posts/old-slug", status: 301, to: "/posts/new-slug/" },
      { from: "/posts/old-slug/", status: 301, to: "/posts/new-slug/" },
    ]);
  });

  it("serializes every configured migration as a permanent redirect", () => {
    const output = serializeRedirectFile(redirectsConfig);

    expect(redirectsConfig.postSlugs).toHaveLength(18);
    expect(output).toContain(
      `${encodeURI("/posts/ai-agent-深度学习指南")} /posts/ai-agent-3114342e/ 301`,
    );
    expect(output).toContain(
      `${encodeURI("/posts/ai-agent-深度学习指南/")} /posts/ai-agent-3114342e/ 301`,
    );
  });

  it.each([
    {
      paths: [
        { from: "/old", to: "/new" },
        { from: "/old", to: "/other" },
      ],
      postSlugs: [],
    },
    {
      paths: [
        { from: "/old", to: "/new" },
        { from: "/new", to: "/final" },
      ],
      postSlugs: [],
    },
    {
      paths: [],
      postSlugs: [{ from: "same", to: "same" }],
    },
  ] satisfies readonly RedirectConfiguration[])(
    "rejects duplicate, chained or identical redirect mappings",
    (configuration) => {
      expect(() => createRedirectRules(configuration)).toThrow();
    },
  );
});
