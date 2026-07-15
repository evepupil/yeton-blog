import path from "node:path";

import matter from "gray-matter";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { z } from "zod";

import { analyzeMarkdown } from "@/lib/content/markdown";
import { articleFrontmatterSchema } from "@/lib/content/schema";
import type { ArticleFrontmatter } from "@/lib/content/schema";

const legacyFrontmatterSchema = z.object({
  description: z.string(),
  draft: z.boolean().optional().default(false),
  image: z.string().optional().default(""),
  lang: z.enum(["zh-CN", "en"]),
  notionPageId: z.string().optional().default(""),
  notionSync: z.boolean().optional().default(false),
  pinned: z.boolean().optional().default(false),
  published: z.union([z.date(), z.string()]),
  tags: z.array(z.string()),
  title: z.string(),
  translationKey: z.string().optional().default(""),
  updated: z.union([z.date(), z.string()]).optional(),
});

interface MarkdownMigration {
  readonly assetPaths: readonly string[];
  readonly markdown: string;
}

interface MarkdownReplacement {
  readonly end: number;
  readonly start: number;
  readonly value: string;
}

function normalizeDate(value: Date | string, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must contain a valid date.`);
  }

  return date.toISOString().slice(0, 10);
}

function normalizeDescription(markdown: string): string {
  const plainText = analyzeMarkdown(markdown).plainText;
  if (plainText.length <= 240) {
    return plainText;
  }

  return `${plainText.slice(0, 237).trimEnd()}...`;
}

export function getLegacyAssetPath(url: string): string | null {
  const normalized = url.replaceAll("\\", "/");
  const match = /^(?:\.\.\/)+assets\/images\/(.+)$/u.exec(normalized);
  if (!match?.[1]) {
    return null;
  }

  const assetPath = path.posix.normalize(match[1]);
  if (assetPath.startsWith("../") || path.posix.isAbsolute(assetPath)) {
    throw new Error(`Legacy asset path escapes the image root: ${url}`);
  }

  return assetPath;
}

export function getMigratedAssetUrl(url: string): string | null {
  const assetPath = getLegacyAssetPath(url);
  return assetPath ? `/images/posts/${assetPath}` : null;
}

export function getMigratedInternalUrl(url: string): string | null {
  if (!url.startsWith("/")) {
    return null;
  }

  const parsed = new URL(url, "https://legacy.invalid");
  const routeRewrites: readonly [RegExp, string][] = [
    [/^\/posts\/en\/(.+)$/u, "/en/posts/$1"],
    [/^\/archive\/en\/tag\/(.+)$/u, "/en/tags/$1"],
    [/^\/archive\/tag\/(.+)$/u, "/tags/$1"],
    [/^\/archive\/en\/?$/u, "/en/archives/"],
    [/^\/archive\/?$/u, "/archives/"],
    [/^\/about\/en\/?$/u, "/en/about/"],
  ];

  for (const [pattern, replacement] of routeRewrites) {
    if (pattern.test(parsed.pathname)) {
      const pathname = parsed.pathname.replace(pattern, replacement);
      return `${pathname}${parsed.search}${parsed.hash}`;
    }
  }

  return null;
}

export function migrateLegacyMarkdown(markdown: string): MarkdownMigration {
  const tree = unified().use(remarkParse).parse(markdown);
  const replacements: MarkdownReplacement[] = [];
  const assetPaths = new Set<string>();

  visit(tree, (node) => {
    if (
      (node.type !== "image" &&
        node.type !== "link" &&
        node.type !== "definition") ||
      !("url" in node) ||
      typeof node.url !== "string"
    ) {
      return;
    }

    const assetPath = getLegacyAssetPath(node.url);
    const migratedUrl = assetPath
      ? `/images/posts/${assetPath}`
      : getMigratedInternalUrl(node.url);
    if (!migratedUrl) {
      return;
    }

    const startOffset = node.position?.start.offset;
    const endOffset = node.position?.end.offset;
    if (startOffset === undefined || endOffset === undefined) {
      throw new Error(`Cannot locate Markdown image URL: ${node.url}`);
    }

    const source = markdown.slice(startOffset, endOffset);
    const relativeUrlOffset = source.indexOf(node.url);
    if (relativeUrlOffset < 0) {
      throw new Error(`Cannot rewrite Markdown image URL: ${node.url}`);
    }

    const start = startOffset + relativeUrlOffset;
    replacements.push({
      end: start + node.url.length,
      start,
      value: migratedUrl,
    });
    if (assetPath) {
      assetPaths.add(assetPath);
    }
  });

  let migrated = markdown;
  for (const replacement of replacements.toSorted(
    (left, right) => right.start - left.start,
  )) {
    migrated =
      migrated.slice(0, replacement.start) +
      replacement.value +
      migrated.slice(replacement.end);
  }

  return {
    assetPaths: Array.from(assetPaths).toSorted(),
    markdown: migrated.trim(),
  };
}

export function migrateLegacyFrontmatter(
  data: unknown,
  pairedTranslationKeys: ReadonlySet<string>,
): ArticleFrontmatter {
  const legacy = legacyFrontmatterSchema.parse(data);
  const image = legacy.image ? getMigratedAssetUrl(legacy.image) : null;
  if (legacy.image && !image) {
    throw new Error(`Unsupported legacy cover image: ${legacy.image}`);
  }

  const translationKey = pairedTranslationKeys.has(legacy.translationKey)
    ? legacy.translationKey
    : undefined;
  const notionPageId = legacy.notionPageId.trim() || undefined;

  return articleFrontmatterSchema.parse({
    description: normalizeDescription(legacy.description),
    draft: legacy.draft,
    ...(image ? { image } : {}),
    locale: legacy.lang,
    ...(notionPageId ? { notionPageId, source: "notion" } : {}),
    pinned: legacy.pinned,
    published: normalizeDate(legacy.published, "published"),
    tags: legacy.tags,
    title: legacy.title.trim(),
    ...(translationKey ? { translationKey } : {}),
    ...(legacy.updated
      ? { updated: normalizeDate(legacy.updated, "updated") }
      : {}),
  });
}

export function serializeMigratedArticle(
  frontmatter: ArticleFrontmatter,
  markdown: string,
): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(frontmatter.title)}`,
    `description: ${JSON.stringify(frontmatter.description)}`,
    `published: ${JSON.stringify(frontmatter.published)}`,
    ...(frontmatter.updated
      ? [`updated: ${JSON.stringify(frontmatter.updated)}`]
      : []),
    `locale: ${JSON.stringify(frontmatter.locale)}`,
    `tags: ${JSON.stringify(frontmatter.tags)}`,
    `draft: ${frontmatter.draft}`,
    `pinned: ${frontmatter.pinned}`,
    ...(frontmatter.image
      ? [`image: ${JSON.stringify(frontmatter.image)}`]
      : []),
    ...(frontmatter.translationKey
      ? [`translationKey: ${JSON.stringify(frontmatter.translationKey)}`]
      : []),
    ...(frontmatter.source
      ? [
          `source: ${JSON.stringify(frontmatter.source)}`,
          `notionPageId: ${JSON.stringify(frontmatter.notionPageId)}`,
        ]
      : []),
    "---",
    "",
    markdown.trim(),
    "",
  ];

  return lines.join("\n");
}

export function parseLegacyArticle(raw: string) {
  return matter(raw);
}
