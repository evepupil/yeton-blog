import type { ArticleFrontmatter, BookFrontmatter } from "@/lib/content/schema";

export interface ContentHeading {
  readonly depth: 2 | 3;
  readonly id: string;
  readonly text: string;
}

interface ContentFile {
  readonly body: string;
  readonly headings: readonly ContentHeading[];
  readonly plainText: string;
  readonly slug: string;
  readonly sourcePath: string;
}

export interface Article extends ArticleFrontmatter, ContentFile {
  readonly readTime: number;
  readonly wordCount: number;
}

export interface Book extends BookFrontmatter, ContentFile {}

export interface TagSummary {
  readonly count: number;
  readonly name: string;
}
