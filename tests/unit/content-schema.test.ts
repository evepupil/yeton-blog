import { describe, expect, it } from "vitest";

import {
  articleFrontmatterSchema,
  bookChapterFrontmatterSchema,
  bookFrontmatterSchema,
} from "@/lib/content/schema";

const validBook = {
  description: "A valid book description.",
  locale: "en",
  order: 1,
  status: "serializing",
  tags: ["Engineering"],
  title: "A valid book",
} as const;

describe("book frontmatter", () => {
  it("accepts book metadata without a reading progress field", () => {
    expect(bookFrontmatterSchema.safeParse(validBook).success).toBe(true);
    expect(
      bookFrontmatterSchema.safeParse({ ...validBook, progress: 50 }).success,
    ).toBe(false);
  });

  it("requires a positive integer chapter order", () => {
    expect(
      bookChapterFrontmatterSchema.safeParse({
        draft: false,
        order: 1,
        title: "Opening",
      }).success,
    ).toBe(true);
    expect(
      bookChapterFrontmatterSchema.safeParse({
        draft: false,
        order: 0,
        title: "Opening",
      }).success,
    ).toBe(false);
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
