import { describe, expect, it } from "vitest";

import {
  migrateLegacyBook,
  migrateLegacyBookFrontmatter,
  normalizeLegacyBookSection,
  rewriteLegacyBookChapterLinks,
} from "@/lib/content/legacy-book-migration";

describe("legacy book migration", () => {
  it("maps completed metadata into the strict book schema", () => {
    const frontmatter = migrateLegacyBookFrontmatter(
      {
        author: "Tae Kim",
        description: "A grammar guide.",
        published: new Date("2012-11-21T00:00:00.000Z"),
        status: "completed",
        tags: ["Japanese", "Grammar"],
        title: "Japanese Grammar Guide",
        translator: "Gemini",
        updated: "2026-01-13",
      },
      3,
    );

    expect(frontmatter).toMatchObject({
      author: "Tae Kim",
      locale: "zh-CN",
      order: 3,
      progress: 100,
      published: "2012-11-21",
      status: "complete",
      translator: "Gemini",
      updated: "2026-01-13",
    });
  });

  it("moves the shallowest section heading to level three", () => {
    const markdown = [
      "# Major section",
      "",
      "## Detail",
      "",
      "```md",
      "# Code example",
      "```",
    ].join("\n");

    expect(normalizeLegacyBookSection(markdown)).toBe(
      [
        "### Major section",
        "",
        "#### Detail",
        "",
        "```md",
        "# Code example",
        "```",
      ].join("\n"),
    );
  });

  it("rewrites parsed chapter links without touching code examples", () => {
    const markdown = [
      "[Read](/books/example/01-start/)",
      "",
      "[Jump](1.2.3)",
      "",
      "[Missing](9.9)",
      "",
      "`/books/example/01-start/`",
    ].join("\n");
    const migrated = rewriteLegacyBookChapterLinks(
      markdown,
      "example",
      new Map([["01-start", "getting-started"]]),
      new Map([["1.2.3", "nested-section"]]),
    );

    expect(migrated).toBe(
      [
        "[Read](/books/example/#getting-started)",
        "",
        "[Jump](/books/example/#nested-section)",
        "",
        "Missing",
        "",
        "`/books/example/01-start/`",
      ].join("\n"),
    );
  });

  it("merges published chapters in filename order and skips drafts", () => {
    const book = migrateLegacyBook({
      chapters: [
        {
          fileName: "02-second.md",
          raw: "---\ntitle: Second\ndraft: false\n---\n\n## Detail",
        },
        {
          fileName: "01-first.md",
          raw: "---\ntitle: First\ndraft: false\n---\n\n# Start",
        },
        {
          fileName: "03-draft.md",
          raw: "---\ntitle: Draft\ndraft: true\n---\n\n## Hidden",
        },
      ],
      indexRaw: [
        "---",
        "title: Example",
        "description: Example description",
        "tags: [Guide]",
        "status: completed",
        "draft: false",
        "---",
        "",
        "See [the first chapter](/books/example/01-first/).",
      ].join("\n"),
      order: 1,
      slug: "example",
    });

    expect(book.chapterCount).toBe(2);
    expect(book.content.indexOf("## First")).toBeLessThan(
      book.content.indexOf("## Second"),
    );
    expect(book.content).not.toContain("## Draft");
    expect(book.content).toContain(
      "[the first chapter](/books/example/#first)",
    );
    expect(book.content).toContain("### Start");
    expect(book.content).toContain("### Detail");
  });
});
