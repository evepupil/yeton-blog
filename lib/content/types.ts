import type {
  ArticleFrontmatter,
  BookChapterFrontmatter,
  BookFrontmatter,
} from "@/lib/content/schema";
import type { SiteLocale } from "@/lib/site-config";

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

export interface ArticlePreview {
  readonly description: string;
  readonly image?: string;
  readonly locale: SiteLocale;
  readonly published: string;
  readonly readTime: number;
  readonly slug: string;
  readonly tags: readonly string[];
  readonly title: string;
  readonly wordCount: number;
}

export interface ArticleNavigation {
  readonly next: ArticlePreview | null;
  readonly previous: ArticlePreview | null;
}

export interface BookChapter extends BookChapterFrontmatter, ContentFile {
  readonly bookSlug: string;
}

export interface Book extends BookFrontmatter, ContentFile {
  readonly chapters: readonly BookChapter[];
}

export interface BookChapterNavigation {
  readonly next: BookChapter | null;
  readonly previous: BookChapter | null;
}

export interface TagSummary {
  readonly count: number;
  readonly name: string;
}
