import path from "node:path";

import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { z } from "zod";

import { bookFrontmatterSchema } from "@/lib/content/schema";
import type { BookFrontmatter } from "@/lib/content/schema";

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
  readonly title: string;
}

export interface MigrateLegacyBookOptions {
  readonly chapters: readonly LegacyBookChapterSource[];
  readonly indexRaw: string;
  readonly order: number;
  readonly slug: string;
}

export interface MigratedLegacyBook {
  readonly chapterCount: number;
  readonly content: string;
  readonly frontmatter: BookFrontmatter;
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

  const depthShift = 3 - minimumDepth;
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

    const depth = Math.min(6, Math.max(3, node.depth + depthShift));
    replacements.push({
      end: startOffset + headingMarker[0].length,
      start: startOffset,
      value: "#".repeat(depth),
    });
  });

  return applyReplacements(markdown, replacements);
}

interface LegacyBookHeadingData {
  readonly secondLevelIds: readonly string[];
  readonly sectionAnchors: ReadonlyMap<string, string>;
}

function collectHeadingData(markdown: string): LegacyBookHeadingData {
  const tree = unified().use(remarkParse).parse(markdown);
  const slugger = new GithubSlugger();
  const secondLevelIds: string[] = [];
  const sectionAnchors = new Map<string, string>();

  visit(tree, "heading", (node) => {
    const text = toString(node).trim();
    const id = slugger.slug(text);
    if (node.depth === 2) {
      secondLevelIds.push(id);
    }

    const sectionNumber = /^(\d+(?:\.\d+)+)(?=\s|$)/u.exec(text)?.[1];
    if (sectionNumber) {
      sectionAnchors.set(sectionNumber, id);
    }
  });

  return { secondLevelIds, sectionAnchors };
}

export function rewriteLegacyBookChapterLinks(
  markdown: string,
  bookSlug: string,
  chapterAnchors: ReadonlyMap<string, string>,
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
    if (
      chapterMatch?.[1] &&
      chapterMatch[2] &&
      decodeURIComponent(chapterMatch[1]) === bookSlug
    ) {
      const anchor = chapterAnchors.get(decodeURIComponent(chapterMatch[2]));
      migratedUrl = anchor ? `/books/${bookSlug}/#${anchor}` : null;
    } else if (/^\d+(?:\.\d+)+$/u.test(node.url)) {
      const anchor = sectionAnchors.get(node.url);
      migratedUrl = anchor ? `/books/${bookSlug}/#${anchor}` : null;
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
    progress: legacy.progress ?? (completed ? 100 : 0),
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
  const lines = [
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
    `progress: ${frontmatter.progress}`,
    `order: ${frontmatter.order}`,
    `draft: ${frontmatter.draft}`,
    "---",
    "",
    markdown.trim(),
    "",
  ];

  return lines.join("\n");
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
  const chapters = options.chapters
    .toSorted((left, right) => left.fileName.localeCompare(right.fileName))
    .map(parseLegacyChapter)
    .filter((chapter): chapter is ParsedLegacyBookChapter => chapter !== null);

  if (chapters.length === 0) {
    throw new Error(`Legacy book ${options.slug} has no published chapters.`);
  }

  const introductionTitle =
    frontmatter.locale === "en" ? "Introduction" : "导读";
  const sections = [
    `## ${introductionTitle}\n\n${normalizeLegacyBookSection(parsedIndex.content)}`,
    ...chapters.map((chapter) => `## ${chapter.title}\n\n${chapter.body}`),
  ];
  const markdown = sections.join("\n\n");
  const headingData = collectHeadingData(markdown);
  const chapterHeadingIds = headingData.secondLevelIds.slice(1);
  if (chapterHeadingIds.length !== chapters.length) {
    throw new Error(`Cannot resolve chapter anchors for ${options.slug}.`);
  }
  const chapterAnchors = new Map(
    chapters.map((chapter, index) => {
      const anchor = chapterHeadingIds[index];
      if (!anchor) {
        throw new Error(`Cannot resolve chapter anchor: ${chapter.title}`);
      }

      return [
        path.basename(chapter.fileName, path.extname(chapter.fileName)),
        anchor,
      ];
    }),
  );
  const migratedMarkdown = rewriteLegacyBookChapterLinks(
    markdown,
    options.slug,
    chapterAnchors,
    headingData.sectionAnchors,
  );

  return {
    chapterCount: chapters.length,
    content: serializeMigratedBook(frontmatter, migratedMarkdown),
    frontmatter,
    slug: options.slug,
  };
}
