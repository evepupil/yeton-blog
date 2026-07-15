import {
  findArticleTranslation,
  findBookTranslation,
} from "@/lib/content/queries";
import type { Article, Book } from "@/lib/content/types";
import { getLocalizedPath, type LocaleRouteMap } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

function getTargetLocale(locale: SiteLocale): SiteLocale {
  return locale === "en" ? "zh-CN" : "en";
}

function getContentPath(
  type: "books" | "posts",
  locale: SiteLocale,
  slug: string,
): string {
  return getLocalizedPath(`/${type}/${slug}/`, locale);
}

export function buildContentLocaleRoutes(
  articles: readonly Article[],
  books: readonly Book[],
): LocaleRouteMap {
  const routes: Record<string, string> = {};

  for (const article of articles) {
    if (article.draft) {
      continue;
    }

    const targetLocale = getTargetLocale(article.locale);
    const translation = findArticleTranslation(articles, article, targetLocale);
    routes[getContentPath("posts", article.locale, article.slug)] = translation
      ? getContentPath("posts", translation.locale, translation.slug)
      : getLocalizedPath("/", targetLocale);
  }

  for (const book of books) {
    if (book.draft) {
      continue;
    }

    const targetLocale = getTargetLocale(book.locale);
    const translation = findBookTranslation(books, book, targetLocale);
    routes[getContentPath("books", book.locale, book.slug)] = translation
      ? getContentPath("books", translation.locale, translation.slug)
      : getLocalizedPath("/", targetLocale);
  }

  return routes;
}
