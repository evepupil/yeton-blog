import type MiniSearch from "minisearch";
import type { SearchResult } from "minisearch";

import { miniSearchOptions, searchQueryOptions } from "@/lib/search/config";
import type {
  SearchDocument,
  SearchResultItem,
  SerializedSearchAsset,
} from "@/lib/search/types";
import type { SiteLocale } from "@/lib/site-config";

export interface LoadedSearchIndex {
  readonly index: MiniSearch<SearchDocument>;
  readonly locale: SiteLocale;
  readonly recent: readonly SearchResultItem[];
}

const searchIndexCache = new Map<SiteLocale, Promise<LoadedSearchIndex>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSearchResultItem(value: unknown): value is SearchResultItem {
  return (
    isRecord(value) &&
    typeof value.description === "string" &&
    typeof value.href === "string" &&
    typeof value.published === "string" &&
    typeof value.readTime === "number" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    typeof value.title === "string"
  );
}

function parseSearchAsset(value: unknown): SerializedSearchAsset {
  if (
    !isRecord(value) ||
    !("index" in value) ||
    !Array.isArray(value.recent) ||
    !value.recent.every(isSearchResultItem)
  ) {
    throw new Error("Search index has an invalid structure.");
  }

  return {
    index: value.index,
    recent: value.recent,
  };
}

async function fetchSearchIndex(
  locale: SiteLocale,
): Promise<LoadedSearchIndex> {
  const [{ default: MiniSearch }, response] = await Promise.all([
    import("minisearch"),
    fetch(`/search-index/${locale}.json`),
  ]);

  if (!response.ok) {
    throw new Error(`Search index request failed with ${response.status}.`);
  }

  const asset = parseSearchAsset(await response.json());
  const index = MiniSearch.loadJSON<SearchDocument>(
    JSON.stringify(asset.index),
    miniSearchOptions,
  );

  return { index, locale, recent: asset.recent };
}

export function loadSearchIndex(
  locale: SiteLocale,
): Promise<LoadedSearchIndex> {
  const cached = searchIndexCache.get(locale);
  if (cached) {
    return cached;
  }

  const request = fetchSearchIndex(locale).catch((error: unknown) => {
    searchIndexCache.delete(locale);
    throw error;
  });
  searchIndexCache.set(locale, request);

  return request;
}

function toSearchResultItem(result: SearchResult): SearchResultItem | null {
  const candidate = {
    description: result.description,
    href: result.href,
    published: result.published,
    readTime: result.readTime,
    tags: result.tagList,
    title: result.title,
  };

  return isSearchResultItem(candidate) ? candidate : null;
}

export function searchLoadedIndex(
  loaded: LoadedSearchIndex,
  query: string,
  limit = 8,
): SearchResultItem[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return loaded.recent.slice(0, limit);
  }

  return loaded.index
    .search(normalizedQuery, searchQueryOptions)
    .flatMap((result) => {
      const item = toSearchResultItem(result);
      return item ? [item] : [];
    })
    .slice(0, limit);
}
