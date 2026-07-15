import { describe, expect, it } from "vitest";

import { bookFrontmatterSchema } from "@/lib/content/schema";

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
