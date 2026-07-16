import { describe, expect, it } from "vitest";

import { getArticleTocHeadings } from "@/lib/content/toc";
import type { ContentHeading } from "@/lib/content/types";

function heading(index: number, depth: 2 | 3): ContentHeading {
  return {
    depth,
    id: `heading-${index}`,
    text: `Heading ${index}`,
  };
}

describe("article table of contents", () => {
  it("keeps second- and third-level headings in a short article", () => {
    const headings = [heading(1, 2), heading(2, 3)];

    expect(getArticleTocHeadings(headings)).toEqual(headings);
  });

  it("keeps only section headings when the detailed list is too long", () => {
    const headings = Array.from({ length: 24 }, (_, index) =>
      heading(index, index % 3 === 0 ? 2 : 3),
    );
    const visible = getArticleTocHeadings(headings);

    expect(visible).toHaveLength(8);
    expect(visible.every((item) => item.depth === 2)).toBe(true);
  });
});
