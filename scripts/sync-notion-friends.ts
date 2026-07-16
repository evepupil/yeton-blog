import path from "node:path";

import { config } from "dotenv";

import { NotionApiContentSource } from "@/lib/notion-sync/client";
import { requireEnvironmentValue } from "@/lib/notion-sync/config";
import { createProcessSyncReporter } from "@/lib/notion-sync/reporter";
import { syncNotionFriends } from "@/lib/notion-sync/sync";

if (!process.env.CI) {
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
}

async function main() {
  const reporter = createProcessSyncReporter();
  reporter.info("🔗 Notion 友情链接同步脚本\n");
  const databaseId = process.env.NOTION_FRIEND_LINK_DATABASE_ID?.trim();
  if (!databaseId) {
    reporter.info(
      "⏭️  未配置 NOTION_FRIEND_LINK_DATABASE_ID，跳过友情链接同步",
    );
    return;
  }
  const token = requireEnvironmentValue(process.env, "NOTION_TOKEN");
  const outputPath = path.join(process.cwd(), "data", "friends.json");
  reporter.info("配置信息:");
  reporter.info(`  Notion Database ID: ${databaseId}`);
  reporter.info(`  输出文件: ${outputPath}\n`);
  const result = await syncNotionFriends({
    databaseId,
    outputPath,
    publicRoot: path.join(process.cwd(), "public"),
    reporter,
    source: new NotionApiContentSource(token),
  });
  reporter.info(`\n${"=".repeat(60)}`);
  reporter.info("✅ 友情链接同步完成!");
  reporter.info(`\n📊 成功同步: ${result.count} 个链接`);
  reporter.info(result.changed ? `💾 已保存: ${outputPath}` : "✅ 内容无变化");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\n❌ Notion 友情链接同步失败: ${message}\n`);
  process.exitCode = 1;
});
