import { describe, expect, it } from "vitest";

import {
  articleFrontmatterSchema,
  bookFrontmatterSchema,
} from "@/lib/content/schema";

const validBook = {
  description: "A valid book description.",
  locale: "en",
  order: 1,
  progress: 67,
  status: "serializing",
  tags: ["Engineering"],
  title: "A valid book",
} as const;

describe("book frontmatter", () => {
  it.each([0, 67, 100])("accepts integer progress %i", (progress) => {
    const result = bookFrontmatterSchema.safeParse({
      ...validBook,
      progress,
    });

    expect(result.success).toBe(true);
  });

  it.each([-1, 50.5, 101])("rejects invalid progress %s", (progress) => {
    const result = bookFrontmatterSchema.safeParse({
      ...validBook,
      progress,
    });

    expect(result.success).toBe(false);
  });
});

describe("article frontmatter source", () => {
  const article = {
    description: "A valid article description.",
    locale: "en",
    published: "2026-07-15",
    tags: ["Notion"],
    title: "Synchronized article",
  } as const;

  it("accepts a complete Notion source marker", () => {
    expect(
      articleFrontmatterSchema.safeParse({
        ...article,
        source: "notion",
        notionPageId: "34a4342e-b403-8095-928c-d890fd41b915",
      }).success,
    ).toBe(true);
  });

  it("accepts a lowercase Unicode translation key", () => {
    expect(
      articleFrontmatterSchema.safeParse({
        ...article,
        translationKey: "cloudflare-配置教程",
      }).success,
    ).toBe(true);
  });

  it("rejects incomplete Notion source markers", () => {
    expect(
      articleFrontmatterSchema.safeParse({ ...article, source: "notion" })
        .success,
    ).toBe(false);
    expect(
      articleFrontmatterSchema.safeParse({
        ...article,
        notionPageId: "34a4342e-b403-8095-928c-d890fd41b915",
      }).success,
    ).toBe(false);
  });
});
