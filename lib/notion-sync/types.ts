import { z } from "zod";

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

export const friendLinkSchema = z.strictObject({
  name: z.string().trim().min(1),
  description: z.string().trim(),
  url: z.url().refine((value) => /^https?:\/\//u.test(value), {
    message: "friend URL must use http or https",
  }),
  avatar: z.string().trim().startsWith("/").optional(),
});

export const friendLinksFileSchema = z.strictObject({
  friends: z.array(friendLinkSchema),
});

export type FriendLink = z.infer<typeof friendLinkSchema>;
export type FriendLinksFile = z.infer<typeof friendLinksFileSchema>;

export interface SyncSummary {
  readonly created: number;
  readonly deleted: number;
  readonly skipped: number;
  readonly unchanged: number;
  readonly updated: number;
}
