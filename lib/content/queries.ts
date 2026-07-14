import type {
  Article,
  ArticleNavigation,
  ArticlePreview,
  Book,
  TagSummary,
} from "@/lib/content/types";
import type { SiteLocale } from "@/lib/site-config";

function toArticlePreview(article: Article): ArticlePreview {
  return {
    description: article.description,
    ...(article.image ? { image: article.image } : {}),
    locale: article.locale,
    published: article.published,
    readTime: article.readTime,
    slug: article.slug,
    tags: article.tags,
    title: article.title,
    wordCount: article.wordCount,
  };
}

export function sortArticles(articles: readonly Article[]): Article[] {
  return articles.toSorted((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return right.published.localeCompare(left.published);
  });
}

export function getPublishedArticles(
  articles: readonly Article[],
  locale: SiteLocale,
): Article[] {
  return sortArticles(
    articles.filter((article) => !article.draft && article.locale === locale),
  );
}

export function getPublishedArticlePreviews(
  articles: readonly Article[],
  locale: SiteLocale,
): ArticlePreview[] {
  return getPublishedArticles(articles, locale).map(toArticlePreview);
}

export function findPublishedArticle(
  articles: readonly Article[],
  locale: SiteLocale,
  slug: string,
): Article | null {
  return (
    articles.find(
      (article) =>
        article.locale === locale && !article.draft && article.slug === slug,
    ) ?? null
  );
}

export function getArticleNavigation(
  articles: readonly Article[],
  article: Article,
): ArticleNavigation {
  const published = getPublishedArticles(articles, article.locale);
  const index = published.findIndex(
    (candidate) => candidate.slug === article.slug,
  );

  if (index < 0) {
    return { next: null, previous: null };
  }

  const previous = published[index - 1];
  const next = published[index + 1];

  return {
    next: next ? toArticlePreview(next) : null,
    previous: previous ? toArticlePreview(previous) : null,
  };
}

export function groupArticlesByYear(
  articles: readonly Article[],
): ReadonlyMap<string, readonly Article[]> {
  const groups = new Map<string, Article[]>();

  for (const article of sortArticles(articles)) {
    const year = article.published.slice(0, 4);
    const entries = groups.get(year) ?? [];
    entries.push(article);
    groups.set(year, entries);
  }

  return groups;
}

export function getTagSummaries(articles: readonly Article[]): TagSummary[] {
  const counts = new Map<string, number>();

  for (const article of articles) {
    for (const tag of article.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([name, count]) => ({ name, count })).toSorted(
    (left, right) =>
      right.count - left.count || left.name.localeCompare(right.name),
  );
}

export function getPublishedBooks(
  books: readonly Book[],
  locale: SiteLocale,
): Book[] {
  return books
    .filter((book) => !book.draft && book.locale === locale)
    .toSorted((left, right) => left.order - right.order);
}

export function findArticleTranslation(
  articles: readonly Article[],
  article: Article,
  targetLocale: SiteLocale,
): Article | null {
  if (!article.translationKey) {
    return null;
  }

  return (
    articles.find(
      (candidate) =>
        candidate.translationKey === article.translationKey &&
        candidate.locale === targetLocale &&
        !candidate.draft,
    ) ?? null
  );
}
