import type { ArticleFrontmatter } from "@/lib/content/schema";

export const syncModes = ["overwrite", "new-only", "append"] as const;
export type SyncMode = (typeof syncModes)[number];

export interface NotionArticleMetadata {
  readonly body: string;
  readonly coverUrl?: string;
  readonly frontmatter: ArticleFrontmatter & {
    readonly notionPageId: string;
    readonly source: "notion";
  };
  readonly pageId: string;
  readonly slug: string;
}

export interface NotionArticleState {
  readonly slug: string;
  readonly translationKey?: string;
}

export interface SyncSummary {
  readonly created: number;
  readonly deleted: number;
  readonly skipped: number;
  readonly unchanged: number;
  readonly updated: number;
}
