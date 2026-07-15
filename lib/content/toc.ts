import type { ContentHeading } from "@/lib/content/types";

const detailedHeadingLimit = 20;

export function getArticleTocHeadings(
  headings: readonly ContentHeading[],
): readonly ContentHeading[] {
  if (headings.length <= detailedHeadingLimit) {
    return headings;
  }

  return headings.filter((heading) => heading.depth === 2);
}

export function getBookChapterHeadings(
  headings: readonly ContentHeading[],
): readonly ContentHeading[] {
  return headings.filter((heading) => heading.depth === 2);
}
