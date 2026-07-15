import type { SiteLocale } from "@/lib/site-config";

export interface SearchDocument {
  readonly content: string;
  readonly description: string;
  readonly href: string;
  readonly id: string;
  readonly locale: SiteLocale;
  readonly published: string;
  readonly readTime: number;
  readonly tagList: readonly string[];
  readonly tags: string;
  readonly title: string;
}

export interface SearchResultItem {
  readonly description: string;
  readonly href: string;
  readonly published: string;
  readonly readTime: number;
  readonly tags: readonly string[];
  readonly title: string;
}

export interface SerializedSearchAsset {
  readonly index: unknown;
  readonly recent: readonly SearchResultItem[];
}
