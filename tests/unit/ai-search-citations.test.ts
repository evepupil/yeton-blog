import { describe, expect, it } from "vitest";

import {
  mapAutoRagCitations,
  resolveCitationHref,
} from "@/lib/ai-search/citations";

describe("AI search citation mapping", () => {
  it("maps legacy Chinese filenames to canonical article URLs", () => {
    expect(
      resolveCitationHref(
        "src/content/posts/claude-code里面使用chatgpt的模型教程.md",
      ),
    ).toBe("/posts/claude-code-chatgpt-34a4342e/");
  });

  it("keeps English citations in the English route tree", () => {
    expect(
      resolveCitationHref(
        "content/posts/en/cloudflare-ai-search-autorag-integration-for-blog-knowledge-assistant.md",
      ),
    ).toBe(
      "/en/posts/cloudflare-ai-search-autorag-integration-for-blog-knowledge-assistant/",
    );
    expect(resolveCitationHref("content/posts/bad slug.md")).toBeNull();
  });

  it("deduplicates, caps and validates AutoRAG sources", () => {
    expect(
      mapAutoRagCitations(
        [
          {
            attributes: { title: "Claude Code 使用 ChatGPT" },
            filename: "claude-code里面使用chatgpt的模型教程.md",
            score: 0.92,
          },
          {
            filename: "claude-code里面使用chatgpt的模型教程.md",
            score: 0.8,
          },
          { filename: "not-markdown.txt" },
          {
            filename: "cloudflare-workers-ai-3594342e.mdx",
            score: 1.7,
          },
        ],
        2,
      ),
    ).toEqual([
      {
        filename: "claude-code里面使用chatgpt的模型教程.md",
        href: "/posts/claude-code-chatgpt-34a4342e/",
        score: 0.92,
        title: "Claude Code 使用 ChatGPT",
      },
      {
        filename: "cloudflare-workers-ai-3594342e.mdx",
        href: "/posts/cloudflare-workers-ai-3594342e/",
        score: 1,
        title: "cloudflare workers ai",
      },
    ]);
  });
});
