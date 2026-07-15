import type { Options, SearchOptions } from "minisearch";

import type { SearchDocument } from "@/lib/search/types";

const searchTokenPattern = /[\p{Script=Han}]|[\p{Letter}\p{Number}]+/gu;

export function tokenizeSearchText(text: string): string[] {
  return (
    text.normalize("NFKC").toLocaleLowerCase().match(searchTokenPattern) ?? []
  );
}

export const searchQueryOptions = {
  boost: {
    content: 1,
    description: 2,
    tags: 3,
    title: 4,
  },
  combineWith: "AND",
  fuzzy: (term: string) => (term.length >= 5 ? 0.2 : false),
  prefix: true,
} satisfies SearchOptions;

export const miniSearchOptions = {
  fields: ["title", "description", "tags", "content"],
  searchOptions: searchQueryOptions,
  storeFields: [
    "description",
    "href",
    "published",
    "readTime",
    "tagList",
    "title",
  ],
  tokenize: tokenizeSearchText,
} satisfies Options<SearchDocument>;
