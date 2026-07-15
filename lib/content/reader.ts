import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import type { z } from "zod";

import { ContentValidationError } from "@/lib/content/errors";
import { analyzeMarkdown } from "@/lib/content/markdown";
import { calculateReadingMetrics } from "@/lib/content/metrics";
import {
  articleFrontmatterSchema,
  bookFrontmatterSchema,
} from "@/lib/content/schema";
import type { Article, Book } from "@/lib/content/types";
import type { SiteLocale } from "@/lib/site-config";

const supportedExtensions = new Set([".md", ".mdx"]);
const slugPattern = /^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u;
const localeDirectories = {
  "zh-CN": "zh",
  en: "en",
} as const satisfies Record<SiteLocale, string>;

interface LoadContentOptions {
  readonly publicRoot?: string;
  readonly root?: string;
}

async function listContentFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true, recursive: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((filePath) => supportedExtensions.has(path.extname(filePath)))
    .toSorted();
}

function parseFrontmatter<T>(
  schema: z.ZodType<T>,
  data: unknown,
  sourcePath: string,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const field =
          issue.path.length > 0 ? issue.path.join(".") : "frontmatter";
        return `${field}: ${issue.message}`;
      })
      .join("; ");
    throw new ContentValidationError(sourcePath, details);
  }

  return result.data;
}

function getSlug(filePath: string, sourcePath: string): string {
  const slug = path.basename(filePath, path.extname(filePath));

  if (!slugPattern.test(slug) || slug !== slug.toLowerCase()) {
    throw new ContentValidationError(
      sourcePath,
      "file name must be a lowercase kebab-case slug without spaces",
    );
  }

  return slug;
}

function validateLocaleDirectory(
  root: string,
  filePath: string,
  locale: SiteLocale,
  sourcePath: string,
) {
  const [localeDirectory] = path.relative(root, filePath).split(path.sep);
  const expectedDirectory = localeDirectories[locale];

  if (localeDirectory !== expectedDirectory) {
    throw new ContentValidationError(
      sourcePath,
      `locale ${locale} must be stored under ${expectedDirectory}/`,
    );
  }
}

interface UniqueContentItem {
  readonly locale: SiteLocale;
  readonly slug: string;
  readonly sourcePath: string;
  readonly translationKey?: string;
}

function validateUniqueContent(
  items: readonly UniqueContentItem[],
  contentLabel: string,
) {
  const slugKeys = new Set<string>();
  const translationGroups = new Map<
    string,
    { locales: Set<SiteLocale>; sourcePath: string }
  >();

  for (const item of items) {
    const slugKey = `${item.locale}:${item.slug}`;
    if (slugKeys.has(slugKey)) {
      throw new ContentValidationError(
        item.sourcePath,
        `duplicate ${contentLabel} slug ${item.slug} for ${item.locale}`,
      );
    }
    slugKeys.add(slugKey);

    if (item.translationKey) {
      const group = translationGroups.get(item.translationKey) ?? {
        locales: new Set<SiteLocale>(),
        sourcePath: item.sourcePath,
      };
      if (group.locales.has(item.locale)) {
        throw new ContentValidationError(
          item.sourcePath,
          `duplicate translation ${item.translationKey} for ${item.locale}`,
        );
      }
      group.locales.add(item.locale);
      translationGroups.set(item.translationKey, group);
    }
  }

  for (const group of translationGroups.values()) {
    if (group.locales.size < 2) {
      throw new ContentValidationError(
        group.sourcePath,
        "translationKey must connect at least two locales",
      );
    }
  }
}

async function validateImage(
  image: string | undefined,
  publicRoot: string,
  sourcePath: string,
) {
  if (!image) {
    return;
  }

  const imagePath = path.resolve(publicRoot, `.${image}`);
  if (!imagePath.startsWith(`${path.resolve(publicRoot)}${path.sep}`)) {
    throw new ContentValidationError(sourcePath, `invalid image path ${image}`);
  }

  try {
    await access(imagePath);
  } catch {
    throw new ContentValidationError(
      sourcePath,
      `image does not exist: ${image}`,
    );
  }
}

async function readArticle(
  root: string,
  publicRoot: string,
  filePath: string,
): Promise<Article> {
  const sourcePath = path
    .relative(process.cwd(), filePath)
    .replaceAll("\\", "/");
  const raw = await readFile(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = parseFrontmatter(
    articleFrontmatterSchema,
    parsed.data,
    sourcePath,
  );
  const body = parsed.content.trim();

  if (!body) {
    throw new ContentValidationError(
      sourcePath,
      "article body cannot be empty",
    );
  }

  validateLocaleDirectory(root, filePath, frontmatter.locale, sourcePath);
  await validateImage(frontmatter.image, publicRoot, sourcePath);
  const analysis = analyzeMarkdown(body);
  const metrics = calculateReadingMetrics(analysis.plainText);

  return {
    ...frontmatter,
    body,
    headings: analysis.headings,
    plainText: analysis.plainText,
    readTime: metrics.readTime,
    slug: getSlug(filePath, sourcePath),
    sourcePath,
    wordCount: metrics.wordCount,
  };
}

async function readBook(root: string, filePath: string): Promise<Book> {
  const sourcePath = path
    .relative(process.cwd(), filePath)
    .replaceAll("\\", "/");
  const raw = await readFile(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = parseFrontmatter(
    bookFrontmatterSchema,
    parsed.data,
    sourcePath,
  );
  const body = parsed.content.trim();

  if (!body) {
    throw new ContentValidationError(sourcePath, "book body cannot be empty");
  }

  validateLocaleDirectory(root, filePath, frontmatter.locale, sourcePath);
  const analysis = analyzeMarkdown(body);

  return {
    ...frontmatter,
    body,
    headings: analysis.headings,
    plainText: analysis.plainText,
    slug: getSlug(filePath, sourcePath),
    sourcePath,
  };
}

export async function loadArticles(
  options: LoadContentOptions = {},
): Promise<Article[]> {
  const root = options.root ?? path.join(process.cwd(), "content", "posts");
  const publicRoot = options.publicRoot ?? path.join(process.cwd(), "public");
  const files = await listContentFiles(root);
  const articles = await Promise.all(
    files.map((filePath) => readArticle(root, publicRoot, filePath)),
  );

  validateUniqueContent(articles, "article");
  return articles;
}

export async function loadBooks(
  options: LoadContentOptions = {},
): Promise<Book[]> {
  const root = options.root ?? path.join(process.cwd(), "content", "books");
  const files = await listContentFiles(root);
  const books = await Promise.all(
    files.map((filePath) => readBook(root, filePath)),
  );

  validateUniqueContent(books, "book");
  return books;
}
