import path from "node:path";

import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { z } from "zod";

import {
  bookChapterFrontmatterSchema,
  bookFrontmatterSchema,
} from "@/lib/content/schema";
import type {
  BookChapterFrontmatter,
  BookFrontmatter,
} from "@/lib/content/schema";

const legacyBookIndexSchema = z.object({
  author: z.string().optional(),
  description: z.string(),
  draft: z.boolean().optional().default(false),
  lang: z.enum(["zh-CN", "en"]).optional().default("zh-CN"),
  progress: z.number().int().min(0).max(100).optional(),
  published: z.union([z.date(), z.string()]).optional(),
  status: z.string().optional().default("completed"),
  tags: z.array(z.string()),
  title: z.string(),
  translator: z.string().optional(),
  updated: z.union([z.date(), z.string()]).optional(),
});

const legacyBookChapterSchema = z.object({
  draft: z.boolean().optional().default(false),
  title: z.string().trim().min(1),
});

interface MarkdownReplacement {
  readonly end: number;
  readonly start: number;
  readonly value: string;
}

export interface LegacyBookChapterSource {
  readonly fileName: string;
  readonly raw: string;
}

interface ParsedLegacyBookChapter {
  readonly body: string;
  readonly fileName: string;
  readonly slug: string;
  readonly title: string;
}

export interface MigrateLegacyBookOptions {
  readonly chapters: readonly LegacyBookChapterSource[];
  readonly indexRaw: string;
  readonly legacySlug?: string;
  readonly order: number;
  readonly slug: string;
}

export interface MigratedLegacyBookChapter {
  readonly content: string;
  readonly frontmatter: BookChapterFrontmatter;
  readonly slug: string;
}

export interface MigratedLegacyBook {
  readonly chapterCount: number;
  readonly chapters: readonly MigratedLegacyBookChapter[];
  readonly frontmatter: BookFrontmatter;
  readonly indexContent: string;
  readonly slug: string;
}

function normalizeDate(value: Date | string, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must contain a valid date.`);
  }

  return date.toISOString().slice(0, 10);
}

function applyReplacements(
  markdown: string,
  replacements: readonly MarkdownReplacement[],
): string {
  let migrated = markdown;
  for (const replacement of replacements.toSorted(
    (left, right) => right.start - left.start,
  )) {
    migrated =
      migrated.slice(0, replacement.start) +
      replacement.value +
      migrated.slice(replacement.end);
  }

  return migrated.trim().replace(/[ \t]+$/gmu, "");
}

export function normalizeLegacyBookSection(markdown: string): string {
  const tree = unified().use(remarkParse).parse(markdown);
  const headingDepths: number[] = [];

  visit(tree, "heading", (node) => {
    headingDepths.push(node.depth);
  });

  const minimumDepth = Math.min(...headingDepths);
  if (!Number.isFinite(minimumDepth)) {
    return markdown.trim().replace(/[ \t]+$/gmu, "");
  }

  const depthShift = 2 - minimumDepth;
  const replacements: MarkdownReplacement[] = [];
  visit(tree, "heading", (node) => {
    const startOffset = node.position?.start.offset;
    if (startOffset === undefined) {
      throw new Error("Cannot locate a legacy book heading.");
    }

    const headingMarker = /^#{1,6}(?=\s)/u.exec(markdown.slice(startOffset));
    if (!headingMarker) {
      throw new Error("Cannot rewrite a legacy book heading.");
    }

    const depth = Math.min(6, Math.max(2, node.depth + depthShift));
    replacements.push({
      end: startOffset + headingMarker[0].length,
      start: startOffset,
      value: "#".repeat(depth),
    });
  });

  return applyReplacements(markdown, replacements);
}

function collectSectionAnchors(markdown: string): ReadonlyMap<string, string> {
  const tree = unified().use(remarkParse).parse(markdown);
  const slugger = new GithubSlugger();
  const sectionAnchors = new Map<string, string>();

  visit(tree, "heading", (node) => {
    const text = toString(node).trim();
    const id = slugger.slug(text);
    const sectionNumber = /^(\d+(?:\.\d+)+)(?=\s|$)/u.exec(text)?.[1];
    if (sectionNumber) {
      sectionAnchors.set(sectionNumber, id);
    }
  });

  return sectionAnchors;
}

export function rewriteLegacyBookChapterLinks(
  markdown: string,
  legacyBookSlug: string,
  canonicalBookSlug: string,
  chapterSlugs: ReadonlySet<string>,
  sectionAnchors: ReadonlyMap<string, string> = new Map(),
): string {
  const tree = unified().use(remarkParse).parse(markdown);
  const replacements: MarkdownReplacement[] = [];

  visit(tree, (node) => {
    if (
      (node.type !== "link" && node.type !== "definition") ||
      !("url" in node) ||
      typeof node.url !== "string"
    ) {
      return;
    }

    let migratedUrl: string | null = null;
    const chapterMatch = /^\/books\/([^/]+)\/([^/?#]+)\/?$/u.exec(node.url);
    if (chapterMatch?.[1] && chapterMatch[2]) {
      const sourceBookSlug = decodeURIComponent(chapterMatch[1]);
      const chapterSlug = decodeURIComponent(chapterMatch[2]);
      if (
        (sourceBookSlug === legacyBookSlug ||
          sourceBookSlug === canonicalBookSlug) &&
        chapterSlugs.has(chapterSlug)
      ) {
        migratedUrl = `/books/${canonicalBookSlug}/${chapterSlug}/`;
      }
    } else if (/^\d+(?:\.\d+)+$/u.test(node.url)) {
      const anchor = sectionAnchors.get(node.url);
      migratedUrl = anchor ? `#${anchor}` : null;
      if (!migratedUrl && node.type === "link") {
        const startOffset = node.position?.start.offset;
        const endOffset = node.position?.end.offset;
        if (startOffset === undefined || endOffset === undefined) {
          throw new Error(`Cannot locate legacy book link: ${node.url}`);
        }

        replacements.push({
          end: endOffset,
          start: startOffset,
          value: toString(node),
        });
        return;
      }
    }

    if (!migratedUrl) {
      return;
    }

    const startOffset = node.position?.start.offset;
    const endOffset = node.position?.end.offset;
    if (startOffset === undefined || endOffset === undefined) {
      throw new Error(`Cannot locate legacy book link: ${node.url}`);
    }

    const source = markdown.slice(startOffset, endOffset);
    const relativeUrlOffset = source.indexOf(node.url);
    if (relativeUrlOffset < 0) {
      throw new Error(`Cannot rewrite legacy book link: ${node.url}`);
    }

    const start = startOffset + relativeUrlOffset;
    replacements.push({
      end: start + node.url.length,
      start,
      value: migratedUrl,
    });
  });

  return applyReplacements(markdown, replacements);
}

export function migrateLegacyBookFrontmatter(
  data: unknown,
  order: number,
): BookFrontmatter {
  const legacy = legacyBookIndexSchema.parse(data);
  const completed = ["complete", "completed"].includes(
    legacy.status.toLowerCase(),
  );

  return bookFrontmatterSchema.parse({
    ...(legacy.author?.trim() ? { author: legacy.author.trim() } : {}),
    description: legacy.description.trim(),
    draft: legacy.draft,
    locale: legacy.lang,
    order,
    ...(legacy.published
      ? { published: normalizeDate(legacy.published, "published") }
      : {}),
    status: completed ? "complete" : "serializing",
    tags: legacy.tags,
    title: legacy.title.trim(),
    ...(legacy.translator?.trim()
      ? { translator: legacy.translator.trim() }
      : {}),
    ...(legacy.updated
      ? { updated: normalizeDate(legacy.updated, "updated") }
      : {}),
  });
}

export function serializeMigratedBook(
  frontmatter: BookFrontmatter,
  markdown: string,
): string {
  return [
    "---",
    `title: ${JSON.stringify(frontmatter.title)}`,
    `description: ${JSON.stringify(frontmatter.description)}`,
    ...(frontmatter.author
      ? [`author: ${JSON.stringify(frontmatter.author)}`]
      : []),
    ...(frontmatter.translator
      ? [`translator: ${JSON.stringify(frontmatter.translator)}`]
      : []),
    ...(frontmatter.published
      ? [`published: ${JSON.stringify(frontmatter.published)}`]
      : []),
    ...(frontmatter.updated
      ? [`updated: ${JSON.stringify(frontmatter.updated)}`]
      : []),
    `locale: ${JSON.stringify(frontmatter.locale)}`,
    `tags: ${JSON.stringify(frontmatter.tags)}`,
    `status: ${JSON.stringify(frontmatter.status)}`,
    `order: ${frontmatter.order}`,
    `draft: ${frontmatter.draft}`,
    "---",
    "",
    markdown.trim(),
    "",
  ].join("\n");
}

function serializeMigratedBookChapter(
  frontmatter: BookChapterFrontmatter,
  markdown: string,
): string {
  return [
    "---",
    `title: ${JSON.stringify(frontmatter.title)}`,
    `order: ${frontmatter.order}`,
    `draft: ${frontmatter.draft}`,
    "---",
    "",
    markdown.trim(),
    "",
  ].join("\n");
}

function parseLegacyChapter(
  source: LegacyBookChapterSource,
): ParsedLegacyBookChapter | null {
  const parsed = matter(source.raw);
  const frontmatter = legacyBookChapterSchema.parse(parsed.data);
  if (frontmatter.draft) {
    return null;
  }

  return {
    body: normalizeLegacyBookSection(parsed.content),
    fileName: source.fileName,
    slug: path.basename(source.fileName, path.extname(source.fileName)),
    title: frontmatter.title,
  };
}

export function migrateLegacyBook(
  options: MigrateLegacyBookOptions,
): MigratedLegacyBook {
  const parsedIndex = matter(options.indexRaw);
  const frontmatter = migrateLegacyBookFrontmatter(
    parsedIndex.data,
    options.order,
  );
  const parsedChapters = options.chapters
    .toSorted((left, right) => left.fileName.localeCompare(right.fileName))
    .map(parseLegacyChapter)
    .filter((chapter): chapter is ParsedLegacyBookChapter => chapter !== null);

  if (parsedChapters.length === 0) {
    throw new Error(`Legacy book ${options.slug} has no published chapters.`);
  }

  const chapterSlugs = new Set(parsedChapters.map((chapter) => chapter.slug));
  const legacyBookSlug = options.legacySlug ?? options.slug;
  const indexMarkdown = rewriteLegacyBookChapterLinks(
    normalizeLegacyBookSection(parsedIndex.content),
    legacyBookSlug,
    options.slug,
    chapterSlugs,
  );
  const chapters = parsedChapters.map((chapter, index) => {
    const chapterFrontmatter = bookChapterFrontmatterSchema.parse({
      draft: false,
      order: index + 1,
      title: chapter.title,
    });
    const markdown = rewriteLegacyBookChapterLinks(
      chapter.body,
      legacyBookSlug,
      options.slug,
      chapterSlugs,
      collectSectionAnchors(chapter.body),
    );

    return {
      content: serializeMigratedBookChapter(chapterFrontmatter, markdown),
      frontmatter: chapterFrontmatter,
      slug: chapter.slug,
    };
  });

  return {
    chapterCount: chapters.length,
    chapters,
    frontmatter,
    indexContent: serializeMigratedBook(frontmatter, indexMarkdown),
    slug: options.slug,
  };
}
