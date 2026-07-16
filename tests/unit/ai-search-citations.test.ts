import { describe, expect, it } from "vitest";

import {
  extractAutoRagSources,
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

  it("maps indexed article URLs and legacy English routes", () => {
    expect(
      resolveCitationHref(
        "https://blog1.chaosyn.com/posts/claude-code%E9%87%8C%E9%9D%A2%E4%BD%BF%E7%94%A8chatgpt%E7%9A%84%E6%A8%A1%E5%9E%8B%E6%95%99%E7%A8%8B/?source=autorag",
      ),
    ).toBe("/posts/claude-code-chatgpt-34a4342e/");
    expect(resolveCitationHref("/posts/en/english-article/")).toBe(
      "/en/posts/english-article/",
    );
    expect(resolveCitationHref("/en/posts/english-article/index.html")).toBe(
      "/en/posts/english-article/",
    );
  });

  it("uses source URLs when filenames cannot identify a blog article", () => {
    expect(
      mapAutoRagCitations(
        [
          {
            attributes: {
              title: "AI Agent 深度学习指南",
              url: "https://blog1.chaosyn.com/posts/ai-agent-%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0%E6%8C%87%E5%8D%97/",
            },
            filename: "indexed-web-page",
            score: 0.88,
          },
          {
            title: "English article",
            url: "https://blog1.chaosyn.com/en/posts/english-article/",
          },
        ],
        5,
      ),
    ).toEqual([
      {
        filename:
          "https://blog1.chaosyn.com/posts/ai-agent-%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0%E6%8C%87%E5%8D%97/",
        href: "/posts/ai-agent-3114342e/",
        score: 0.88,
        title: "AI Agent 深度学习指南",
      },
      {
        filename: "https://blog1.chaosyn.com/en/posts/english-article/",
        href: "/en/posts/english-article/",
        score: null,
        title: "English article",
      },
    ]);
  });

  it("keeps the readable legacy slug as the fallback title", () => {
    expect(
      mapAutoRagCitations(
        [
          {
            filename:
              "https://blog.chaosyn.com/posts/cloudflare-ai-search-autorag-%E6%8E%A5%E5%85%A5%E5%AE%9E%E6%88%98-%E4%B8%AA%E4%BA%BA%E5%8D%9A%E5%AE%A2%E7%9A%84%E7%9F%A5%E8%AF%86%E5%BA%93ai%E5%8A%A9%E6%89%8B/",
          },
        ],
        1,
      )[0]?.title,
    ).toBe("cloudflare ai search autorag 接入实战 个人博客的知识库ai助手");
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

  it("extracts sources from direct and wrapped AutoRAG search results", () => {
    const sources = [{ filename: "article.md" }];
    expect(extractAutoRagSources({ data: sources })).toBe(sources);
    expect(extractAutoRagSources({ result: { data: sources } })).toBe(sources);
    expect(extractAutoRagSources({ result: {} })).toEqual([]);
  });
});
