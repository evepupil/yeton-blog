import type { Metadata } from "next";

import { getBookHref } from "@/features/books/book-links";
import { getPostHref } from "@/features/posts/post-links";
import type { Article, Book } from "@/lib/content/types";
import {
  buildPageMetadata,
  getAbsoluteUrl,
  getLocaleSiteName,
  type LocalePathMap,
} from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site-config";

function getArticleLocalePaths(
  article: Article,
  translation: Article | null,
): LocalePathMap {
  return {
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
}

function getBookLocalePaths(
  book: Book,
  translation: Book | null,
): LocalePathMap {
  return {
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
}

export function buildArticleMetadata(
  article: Article,
  translation: Article | null,
): Metadata {
  const pathname = getPostHref(article.locale, article.slug);
  const metadata = buildPageMetadata({
    alternatePaths: getArticleLocalePaths(article, translation),
    description: article.description,
    ...(article.image ? { image: article.image } : {}),
    locale: article.locale,
    pathname,
    title: article.title,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      authors: [siteConfig.author],
      modifiedTime: article.updated ?? article.published,
      publishedTime: article.published,
      section: article.tags[0],
      tags: article.tags,
      type: "article",
    },
  };
}

export function buildBookMetadata(
  book: Book,
  translation: Book | null,
): Metadata {
  return buildPageMetadata({
    alternatePaths: getBookLocalePaths(book, translation),
    description: book.description,
    locale: book.locale,
    pathname: getBookHref(book.locale, book.slug),
    title: book.title,
  });
}

export function buildArticleStructuredData(article: Article) {
  const articleUrl = getAbsoluteUrl(
    getPostHref(article.locale, article.slug),
  ).toString();
  const imageUrl = getAbsoluteUrl(
    article.image ?? siteConfig.socialImage,
  ).toString();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: {
      "@type": "Person",
      name: siteConfig.author,
    },
    dateModified: article.updated ?? article.published,
    datePublished: article.published,
    description: article.description,
    headline: article.title,
    image: imageUrl,
    inLanguage: article.locale,
    mainEntityOfPage: {
      "@id": articleUrl,
      "@type": "WebPage",
    },
    publisher: {
      "@type": "Organization",
      name: getLocaleSiteName(article.locale),
    },
    url: articleUrl,
  } as const;
}
