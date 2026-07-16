import path from "node:path";

import { config } from "dotenv";

import { NotionApiContentSource } from "@/lib/notion-sync/client";
import {
  parseSyncMode,
  requireEnvironmentValue,
} from "@/lib/notion-sync/config";
import { createProcessSyncReporter } from "@/lib/notion-sync/reporter";
import { syncNotionArticles } from "@/lib/notion-sync/sync";
import type { SyncMode, SyncSummary } from "@/lib/notion-sync/types";

if (!process.env.CI) {
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
}

async function main() {
  const token = requireEnvironmentValue(process.env, "NOTION_TOKEN");
  const databaseId = requireEnvironmentValue(process.env, "NOTION_DATABASE_ID");
  const mode = parseSyncMode(process.argv.slice(2));
  const contentRoot = path.join(process.cwd(), "content", "posts");
  const publicRoot = path.join(process.cwd(), "public");
  const reporter = createProcessSyncReporter();

  const modeDescriptions: Record<SyncMode, string> = {
    append: "纯增量（添加新文章并更新 Notion 文章，不删除旧文章）",
    "new-only": "仅新增（不覆盖已存在文章，不删除旧文章）",
    overwrite: "完全同步（只覆盖/删除带 Notion 标记的文章）",
  };
  reporter.info("🚀 Notion 博客同步脚本\n");
  reporter.info(`同步模式: ${modeDescriptions[mode]}`);
  reporter.info("\n配置信息:");
  reporter.info(`  Notion Database ID: ${databaseId}`);
  reporter.info(`  文章目录: ${contentRoot}`);
  reporter.info(`  图片目录: ${path.join(publicRoot, "images", "notion")}\n`);

  const summary = await syncNotionArticles({
    contentRoot,
    databaseId,
    mode,
    publicRoot,
    publishedStatus: process.env.NOTION_PUBLISHED_STATUS?.trim() || "Published",
    reporter,
    source: new NotionApiContentSource(token),
  });
  printSummary(summary, reporter.info);
}

function printSummary(summary: SyncSummary, info: (message: string) => void) {
  info(`\n${"=".repeat(60)}`);
  info("✅ 同步完成!");
  info("\n📊 统计信息:");
  info(`  - 新增: ${summary.created} 篇`);
  info(`  - 更新: ${summary.updated} 篇`);
  info(`  - 无变化: ${summary.unchanged} 篇`);
  info(`  - 跳过: ${summary.skipped} 篇`);
  info(`  - 删除: ${summary.deleted} 篇`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n❌ Notion 文章同步失败: ${message}\n`);
  process.exitCode = 1;
});
