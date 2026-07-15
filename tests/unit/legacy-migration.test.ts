import { describe, expect, it } from "vitest";

import {
  getLegacyAssetPath,
  getMigratedInternalUrl,
  migrateLegacyFrontmatter,
  migrateLegacyMarkdown,
  serializeMigratedArticle,
} from "@/lib/content/legacy-migration";

describe("legacy content migration", () => {
  it("normalizes legacy frontmatter and keeps paired translations", () => {
    const frontmatter = migrateLegacyFrontmatter(
      {
        category: "技术",
        description: "> A **short** description",
        image: "../assets/images/example/cover.jpg",
        lang: "zh-CN",
        notionPageId: "34a4342e-b403-8095-928c-d890fd41b915",
        notionSync: true,
        published: new Date("2026-02-24T00:00:00.000Z"),
        tags: ["AI"],
        title: "Example",
        translationKey: "example-post",
      },
      new Set(["example-post"]),
    );

    expect(frontmatter).toMatchObject({
      description: "A short description",
      image: "/images/posts/example/cover.jpg",
      locale: "zh-CN",
      notionPageId: "34a4342e-b403-8095-928c-d890fd41b915",
      published: "2026-02-24",
      source: "notion",
      translationKey: "example-post",
    });
    expect(frontmatter).not.toHaveProperty("category");
  });

  it("drops an orphan translation key and truncates long descriptions", () => {
    const frontmatter = migrateLegacyFrontmatter(
      {
        description: "x".repeat(260),
        lang: "en",
        published: "2026-02-24",
        tags: ["AI"],
        title: "Example",
        translationKey: "orphan",
      },
      new Set(),
    );

    expect(frontmatter.description).toHaveLength(240);
    expect(frontmatter.description.endsWith("...")).toBe(true);
    expect(frontmatter.translationKey).toBeUndefined();
  });

  it("rewrites parsed image URLs without touching code examples", () => {
    const source = [
      "![Screenshot](../assets/images/example/image-1.png)",
      "",
      "```md",
      "![Example](../assets/images/example/image-1.png)",
      "```",
    ].join("\n");
    const migrated = migrateLegacyMarkdown(source);

    expect(migrated.assetPaths).toEqual(["example/image-1.png"]);
    expect(migrated.markdown).toContain(
      "![Screenshot](/images/posts/example/image-1.png)",
    );
    expect(migrated.markdown).toContain(
      "![Example](../assets/images/example/image-1.png)",
    );
  });

  it("rejects asset paths that leave the legacy image directory", () => {
    expect(() =>
      getLegacyAssetPath("../assets/images/../../secret.txt"),
    ).toThrow("escapes the image root");
  });

  it("rewrites legacy internal routes while preserving query and hash", () => {
    expect(getMigratedInternalUrl("/posts/en/example/?from=old#section")).toBe(
      "/en/posts/example/?from=old#section",
    );
    expect(getMigratedInternalUrl("/archive/tag/Cloudflare/")).toBe(
      "/tags/Cloudflare/",
    );
    expect(getMigratedInternalUrl("https://example.com/posts/en/test/")).toBe(
      null,
    );
  });

  it("rewrites links found by the Markdown parser", () => {
    const migrated = migrateLegacyMarkdown(
      "[Related post](/posts/en/example/) and `/posts/en/example/`",
    );

    expect(migrated.markdown).toBe(
      "[Related post](/en/posts/example/) and `/posts/en/example/`",
    );
  });

  it("serializes dates as strings accepted by the strict schema", () => {
    const frontmatter = migrateLegacyFrontmatter(
      {
        description: "Description",
        lang: "en",
        published: "2026-02-24",
        tags: ["AI"],
        title: "Example",
      },
      new Set(),
    );
    const output = serializeMigratedArticle(frontmatter, "## Body");

    expect(output).toContain('published: "2026-02-24"');
    expect(output).toContain('locale: "en"');
    expect(output).toContain("## Body");
  });
});
