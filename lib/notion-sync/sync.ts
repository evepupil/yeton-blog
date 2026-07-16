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
import {
  silentSyncReporter,
  type SyncReporter,
} from "@/lib/notion-sync/reporter";
import type { SyncMode, SyncSummary } from "@/lib/notion-sync/types";

interface SyncArticlesOptions {
  readonly contentRoot: string;
  readonly databaseId: string;
  readonly fetchImage?: ImageFetcher;
  readonly mode: SyncMode;
  readonly publicRoot: string;
  readonly publishedStatus?: string;
  readonly reporter?: SyncReporter;
  readonly source: NotionContentSource;
}

export async function syncNotionArticles({
  contentRoot,
  databaseId,
  fetchImage,
  mode,
  publicRoot,
  publishedStatus = "Published",
  reporter = silentSyncReporter,
  source,
}: SyncArticlesOptions): Promise<SyncSummary> {
  reporter.info("📥 从 Notion 获取已发布文章...");
  const pages = await source.listPublishedArticles(databaseId, publishedStatus);
  reporter.info(`✅ 找到 ${pages.length} 篇已发布文章`);
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
    reporter.info("");
    reporter.info(`📝 处理文章: ${article.frontmatter.title}`);
    reporter.info(`   Slug: ${article.slug}`);
    if (ownership === "notion" && mode === "new-only") {
      reporter.info(`  ⏭️  跳过（已存在）: ${path.basename(destination)}`);
      skipped += 1;
      continue;
    }
    if (ownership === "notion") {
      reporter.info(
        mode === "append"
          ? "  ♻️  更新已存在的 Notion 文章"
          : "  🔄 覆盖已存在的 Notion 文章",
      );
    }

    const assets = await prepareArticleAssets(
      article,
      publicRoot,
      fetchImage,
      reporter,
    );
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
    if (!changed) {
      unchanged += 1;
      reporter.info(`  ✅ 内容无变化: ${path.basename(destination)}`);
    } else if (ownership === "missing") {
      created += 1;
      reporter.info(`  💾 已新增: ${path.basename(destination)}`);
    } else {
      updated += 1;
      reporter.info(`  💾 已保存: ${path.basename(destination)}`);
    }
  }

  let deleted = 0;
  if (mode === "overwrite" && pages.length > 0) {
    reporter.info("");
    reporter.info("🗑️  清理本地多余的 Notion 文章...");
    deleted = await removeStaleNotionArticles(
      contentRoot,
      publicRoot,
      destinations,
    );
    reporter.info(
      deleted === 0
        ? "  ✅ 没有需要清理的 Notion 文章"
        : `  ✅ 已清理 ${deleted} 篇多余的 Notion 文章`,
    );
  }
  return { created, deleted, skipped, unchanged, updated };
}

interface SyncFriendsOptions {
  readonly databaseId: string;
  readonly fetchImage?: ImageFetcher;
  readonly outputPath: string;
  readonly publicRoot: string;
  readonly reporter?: SyncReporter;
  readonly source: NotionContentSource;
}

export async function syncNotionFriends({
  databaseId,
  fetchImage,
  outputPath,
  publicRoot,
  reporter = silentSyncReporter,
  source,
}: SyncFriendsOptions): Promise<{ changed: boolean; count: number }> {
  reporter.info("📥 从 Notion 获取友情链接...");
  const pages = await source.listApprovedFriends(databaseId);
  reporter.info(`✅ 找到 ${pages.length} 个已通过的友情链接`);
  const friends = pages.map(mapNotionFriend);
  const localizedFriends = await prepareFriendAvatars(
    friends,
    publicRoot,
    fetchImage,
    reporter,
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
