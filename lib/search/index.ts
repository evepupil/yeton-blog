import MiniSearch from "minisearch";

import { getPostHref } from "@/features/posts/post-links";
import { getPublishedArticles } from "@/lib/content/queries";
import type { Article } from "@/lib/content/types";
import { miniSearchOptions } from "@/lib/search/config";
import type {
  SearchDocument,
  SearchResultItem,
  SerializedSearchAsset,
} from "@/lib/search/types";
import type { SiteLocale } from "@/lib/site-config";

export function buildSearchDocuments(
  articles: readonly Article[],
  locale: SiteLocale,
): SearchDocument[] {
  return getPublishedArticles(articles, locale).map((article) => ({
    content: article.plainText,
    description: article.description,
    href: getPostHref(article.locale, article.slug),
    id: `${article.locale}:${article.slug}`,
    locale: article.locale,
    published: article.published,
    readTime: article.readTime,
    tagList: [...article.tags],
    tags: article.tags.join(" "),
    title: article.title,
  }));
}

export function createSearchIndex(
  documents: readonly SearchDocument[],
): MiniSearch<SearchDocument> {
  const index = new MiniSearch<SearchDocument>(miniSearchOptions);
  index.addAll(documents);

  return index;
}

function toRecentResult(document: SearchDocument): SearchResultItem {
  return {
    description: document.description,
    href: document.href,
    published: document.published,
    readTime: document.readTime,
    tags: document.tagList,
    title: document.title,
  };
}

export function buildSerializedSearchAsset(
  articles: readonly Article[],
  locale: SiteLocale,
): SerializedSearchAsset {
  const documents = buildSearchDocuments(articles, locale);
  const index = createSearchIndex(documents);

  return {
    index: index.toJSON(),
    recent: documents.slice(0, 5).map(toRecentResult),
  };
}
