import type { MetadataRoute } from "next";

import { getBookChapterHref, getBookHref } from "@/features/books/book-links";
import { getPostHref } from "@/features/posts/post-links";
import { getTagHref } from "@/features/tags/tag-links";
import {
  findArticleTranslation,
  findBookChapterTranslation,
  findBookTranslation,
  getPublishedArticles,
  getPublishedBookChapters,
  getPublishedBooks,
  getTagSummaries,
} from "@/lib/content/queries";
import type { Article, Book } from "@/lib/content/types";
import { getLocalizedPath } from "@/lib/i18n";
import { getAbsoluteUrl, type LocalePathMap } from "@/lib/seo/metadata";
import type { SiteLocale } from "@/lib/site-config";

interface SitemapInput {
  readonly articles: readonly Article[];
  readonly books: readonly Book[];
}

function buildLanguageAlternates(paths: LocalePathMap) {
  return Object.fromEntries(
    Object.entries(paths).flatMap(([locale, path]) =>
      path ? [[locale, getAbsoluteUrl(path).toString()]] : [],
    ),
  );
}

function buildEntry(
  pathname: string,
  options: {
    readonly alternatePaths?: LocalePathMap;
    readonly changeFrequency: NonNullable<
      MetadataRoute.Sitemap[number]["changeFrequency"]
    >;
    readonly lastModified?: string;
    readonly priority: number;
  },
): MetadataRoute.Sitemap[number] {
  return {
    ...(options.alternatePaths
      ? {
          alternates: {
            languages: buildLanguageAlternates(options.alternatePaths),
          },
        }
      : {}),
    changeFrequency: options.changeFrequency,
    ...(options.lastModified ? { lastModified: options.lastModified } : {}),
    priority: options.priority,
    url: getAbsoluteUrl(pathname).toString(),
  };
}

export function buildSitemap({
  articles,
  books,
}: SitemapInput): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const sectionPaths = [
    "/",
    "/posts/",
    "/archives/",
    "/books/",
    "/links/",
    "/about/",
  ];
  const latestPublished = getPublishedArticles(articles, "zh-CN")[0]?.published;

  for (const basePath of sectionPaths) {
    const alternatePaths = {
      "zh-CN": getLocalizedPath(basePath, "zh-CN"),
      en: getLocalizedPath(basePath, "en"),
    } satisfies LocalePathMap;

    for (const locale of ["zh-CN", "en"] as const) {
      entries.push(
        buildEntry(alternatePaths[locale], {
          alternatePaths,
          changeFrequency: basePath === "/" ? "weekly" : "monthly",
          ...(latestPublished ? { lastModified: latestPublished } : {}),
          priority: basePath === "/" ? 1 : 0.7,
        }),
      );
    }
  }

  for (const locale of ["zh-CN", "en"] as const) {
    const targetLocale: SiteLocale = locale === "en" ? "zh-CN" : "en";

    for (const article of getPublishedArticles(articles, locale)) {
      const translation = findArticleTranslation(
        articles,
        article,
        targetLocale,
      );
      const alternatePaths: LocalePathMap = {
        [article.locale]: getPostHref(article.locale, article.slug),
        ...(translation
          ? {
              [translation.locale]: getPostHref(
                translation.locale,
                translation.slug,
              ),
            }
          : {}),
      };

      entries.push(
        buildEntry(getPostHref(article.locale, article.slug), {
          alternatePaths,
          changeFrequency: "monthly",
          lastModified: article.updated ?? article.published,
          priority: 0.8,
        }),
      );
    }

    for (const book of getPublishedBooks(books, locale)) {
      const translation = findBookTranslation(books, book, targetLocale);
      const alternatePaths: LocalePathMap = {
        [book.locale]: getBookHref(book.locale, book.slug),
        ...(translation
          ? {
              [translation.locale]: getBookHref(
                translation.locale,
                translation.slug,
              ),
            }
          : {}),
      };

      entries.push(
        buildEntry(getBookHref(book.locale, book.slug), {
          alternatePaths,
          changeFrequency: "monthly",
          ...(book.updated || book.published
            ? { lastModified: book.updated ?? book.published }
            : {}),
          priority: 0.7,
        }),
      );

      for (const chapter of getPublishedBookChapters(book)) {
        const chapterTranslation = findBookChapterTranslation(
          books,
          book,
          chapter,
          targetLocale,
        );
        const chapterAlternatePaths: LocalePathMap = {
          [book.locale]: getBookChapterHref(
            book.locale,
            book.slug,
            chapter.slug,
          ),
          ...(chapterTranslation
            ? {
                [chapterTranslation.book.locale]: getBookChapterHref(
                  chapterTranslation.book.locale,
                  chapterTranslation.book.slug,
                  chapterTranslation.chapter.slug,
                ),
              }
            : {}),
        };

        entries.push(
          buildEntry(getBookChapterHref(book.locale, book.slug, chapter.slug), {
            alternatePaths: chapterAlternatePaths,
            changeFrequency: "monthly",
            ...(book.updated || book.published
              ? { lastModified: book.updated ?? book.published }
              : {}),
            priority: 0.6,
          }),
        );
      }
    }

    const localeArticles = getPublishedArticles(articles, locale);
    for (const { name } of getTagSummaries(localeArticles)) {
      entries.push(
        buildEntry(getTagHref(locale, name), {
          changeFrequency: "monthly",
          priority: 0.5,
        }),
      );
    }
  }

  return entries;
}
