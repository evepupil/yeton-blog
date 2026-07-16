import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import type { z } from "zod";

import { ContentValidationError } from "@/lib/content/errors";
import { analyzeMarkdown } from "@/lib/content/markdown";
import { calculateReadingMetrics } from "@/lib/content/metrics";
import {
  articleFrontmatterSchema,
  bookChapterFrontmatterSchema,
  bookFrontmatterSchema,
} from "@/lib/content/schema";
import type { Article, Book, BookChapter } from "@/lib/content/types";
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

  return validateSlug(slug, sourcePath);
}

function validateSlug(slug: string, sourcePath: string): string {
  if (!slugPattern.test(slug) || slug !== slug.toLowerCase()) {
    throw new ContentValidationError(
      sourcePath,
      "file name must be a lowercase kebab-case slug without spaces",
    );
  }

  return slug;
}

function getSourcePath(filePath: string): string {
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
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
  const sourcePath = getSourcePath(filePath);
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

async function readBookChapter(
  filePath: string,
  bookSlug: string,
): Promise<BookChapter> {
  const sourcePath = getSourcePath(filePath);
  const raw = await readFile(filePath, "utf8");
  const parsed = matter(raw);
  const frontmatter = parseFrontmatter(
    bookChapterFrontmatterSchema,
    parsed.data,
    sourcePath,
  );
  const body = parsed.content.trim();

  if (!body) {
    throw new ContentValidationError(
      sourcePath,
      "book chapter body cannot be empty",
    );
  }

  const analysis = analyzeMarkdown(body);

  return {
    ...frontmatter,
    body,
    bookSlug,
    headings: analysis.headings,
    plainText: analysis.plainText,
    slug: getSlug(filePath, sourcePath),
    sourcePath,
  };
}

function validateBookChapters(
  chapters: readonly BookChapter[],
  indexSourcePath: string,
): void {
  const orders = new Set<number>();
  const slugs = new Set<string>();

  for (const chapter of chapters) {
    if (orders.has(chapter.order)) {
      throw new ContentValidationError(
        chapter.sourcePath,
        `duplicate chapter order ${chapter.order}`,
      );
    }
    if (slugs.has(chapter.slug)) {
      throw new ContentValidationError(
        chapter.sourcePath,
        `duplicate chapter slug ${chapter.slug}`,
      );
    }
    orders.add(chapter.order);
    slugs.add(chapter.slug);
  }

  if (chapters.length === 0) {
    throw new ContentValidationError(
      indexSourcePath,
      "book must contain at least one chapter",
    );
  }
}

async function readBook(root: string, directory: string): Promise<Book> {
  const entries = await readdir(directory, { withFileTypes: true });
  const indexEntry = entries.find(
    (entry) =>
      entry.isFile() &&
      path.basename(entry.name, path.extname(entry.name)) === "index" &&
      supportedExtensions.has(path.extname(entry.name)),
  );
  if (!indexEntry) {
    throw new ContentValidationError(
      getSourcePath(directory),
      "book directory must contain index.md or index.mdx",
    );
  }

  const indexPath = path.join(directory, indexEntry.name);
  const sourcePath = getSourcePath(indexPath);
  const raw = await readFile(indexPath, "utf8");
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

  validateLocaleDirectory(root, indexPath, frontmatter.locale, sourcePath);
  const slug = validateSlug(path.basename(directory), sourcePath);
  const chapterFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name !== indexEntry.name &&
        supportedExtensions.has(path.extname(entry.name)),
    )
    .map((entry) => path.join(directory, entry.name));
  const chapters = (
    await Promise.all(
      chapterFiles.map((filePath) => readBookChapter(filePath, slug)),
    )
  ).toSorted((left, right) => left.order - right.order);
  validateBookChapters(chapters, sourcePath);
  const analysis = analyzeMarkdown(body);

  return {
    ...frontmatter,
    body,
    chapters,
    headings: analysis.headings,
    plainText: analysis.plainText,
    slug,
    sourcePath,
  };
}

async function listBookDirectories(root: string): Promise<string[]> {
  const directories = await Promise.all(
    Object.values(localeDirectories).map(async (localeDirectory) => {
      const localeRoot = path.join(root, localeDirectory);
      let entries;
      try {
        entries = await readdir(localeRoot, { withFileTypes: true });
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return [];
        }
        throw error;
      }

      const legacyFile = entries.find(
        (entry) =>
          entry.isFile() && supportedExtensions.has(path.extname(entry.name)),
      );
      if (legacyFile) {
        throw new ContentValidationError(
          getSourcePath(path.join(localeRoot, legacyFile.name)),
          "book files must live in a book directory with an index file",
        );
      }

      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(localeRoot, entry.name));
    }),
  );

  return directories.flat().toSorted();
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
  const directories = await listBookDirectories(root);
  const books = await Promise.all(
    directories.map((directory) => readBook(root, directory)),
  );

  validateUniqueContent(books, "book");
  return books;
}
