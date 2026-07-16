import { mkdir } from "node:fs/promises";
import path from "node:path";

import { articleFrontmatterSchema } from "@/lib/content/schema";
import {
  mapNotionArticle,
  serializeNotionArticle,
} from "@/lib/notion-sync/article";
import type { NotionContentSource } from "@/lib/notion-sync/client";
import { friendLinksFileSchema } from "@/lib/friends/schema";
import { mapNotionFriend } from "@/lib/notion-sync/friends";
import {
  prepareArticleAssets,
  prepareFriendAvatars,
  type ImageFetcher,
} from "@/lib/notion-sync/images";
import {
  getArticlePath,
  readArticleOwnership,
  removeStaleNotionArticles,
  type ArticleOwnership,
  writeTextIfChanged,
} from "@/lib/notion-sync/store";
import type { SyncMode, SyncSummary } from "@/lib/notion-sync/types";

interface SyncArticlesOptions {
  readonly contentRoot: string;
  readonly databaseId: string;
  readonly fetchImage?: ImageFetcher;
  readonly mode: SyncMode;
  readonly publicRoot: string;
  readonly publishedStatus?: string;
  readonly source: NotionContentSource;
}

export async function syncNotionArticles({
  contentRoot,
  databaseId,
  fetchImage,
  mode,
  publicRoot,
  publishedStatus = "Published",
  source,
}: SyncArticlesOptions): Promise<SyncSummary> {
  const pages = await source.listPublishedArticles(databaseId, publishedStatus);
  const articles = [];
  for (const page of pages) {
    articles.push(mapNotionArticle(page, await source.renderArticle(page.id)));
  }

  const destinations = new Set<string>();
  for (const article of articles) {
    const destination = path.resolve(
      getArticlePath(contentRoot, article.frontmatter.locale, article.slug),
    );
    if (destinations.has(destination)) {
      throw new Error(`Multiple Notion pages resolve to ${destination}.`);
    }
    destinations.add(destination);
  }

  await Promise.all([
    mkdir(path.join(contentRoot, "zh"), { recursive: true }),
    mkdir(path.join(contentRoot, "en"), { recursive: true }),
  ]);
  const ownershipByDestination = new Map<string, ArticleOwnership>();
  for (const article of articles) {
    const destination = path.resolve(
      getArticlePath(contentRoot, article.frontmatter.locale, article.slug),
    );
    const ownership = await readArticleOwnership(destination);
    if (ownership === "manual") {
      throw new Error(
        `Notion article collides with manual file ${destination}.`,
      );
    }
    ownershipByDestination.set(destination, ownership);
  }
  let created = 0;
  let skipped = 0;
  let unchanged = 0;
  let updated = 0;

  for (const article of articles) {
    const destination = path.resolve(
      getArticlePath(contentRoot, article.frontmatter.locale, article.slug),
    );
    const ownership = ownershipByDestination.get(destination);
    if (!ownership) {
      throw new Error(`Missing ownership preflight for ${destination}.`);
    }
    if (ownership === "notion" && mode === "new-only") {
      skipped += 1;
      continue;
    }

    const assets = await prepareArticleAssets(article, publicRoot, fetchImage);
    const frontmatter = articleFrontmatterSchema.parse({
      ...article.frontmatter,
      image: assets.coverPath,
    });
    if (frontmatter.source !== "notion" || !frontmatter.notionPageId) {
      throw new Error(
        `Notion article ${article.pageId} lost its source marker.`,
      );
    }
    const changed = await writeTextIfChanged(
      destination,
      serializeNotionArticle({
        ...article,
        body: assets.body,
        frontmatter: {
          ...frontmatter,
          notionPageId: frontmatter.notionPageId,
          source: frontmatter.source,
        },
      }),
    );
    if (!changed) unchanged += 1;
    else if (ownership === "missing") created += 1;
    else updated += 1;
  }

  const deleted =
    mode === "overwrite" && pages.length > 0
      ? await removeStaleNotionArticles(contentRoot, publicRoot, destinations)
      : 0;
  return { created, deleted, skipped, unchanged, updated };
}

interface SyncFriendsOptions {
  readonly databaseId: string;
  readonly fetchImage?: ImageFetcher;
  readonly outputPath: string;
  readonly publicRoot: string;
  readonly source: NotionContentSource;
}

export async function syncNotionFriends({
  databaseId,
  fetchImage,
  outputPath,
  publicRoot,
  source,
}: SyncFriendsOptions): Promise<{ changed: boolean; count: number }> {
  const pages = await source.listApprovedFriends(databaseId);
  const friends = pages.map(mapNotionFriend);
  const localizedFriends = await prepareFriendAvatars(
    friends,
    publicRoot,
    fetchImage,
  );
  const output = friendLinksFileSchema.parse({ friends: localizedFriends });
  await mkdir(path.dirname(outputPath), { recursive: true });
  return {
    changed: await writeTextIfChanged(
      outputPath,
      `${JSON.stringify(output, null, 2)}\n`,
    ),
    count: output.friends.length,
  };
}
