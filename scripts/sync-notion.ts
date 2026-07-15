import path from "node:path";

import { config } from "dotenv";

import { NotionApiContentSource } from "@/lib/notion-sync/client";
import {
  parseSyncMode,
  requireEnvironmentValue,
} from "@/lib/notion-sync/config";
import { syncNotionArticles } from "@/lib/notion-sync/sync";

if (!process.env.CI) {
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
}

async function main() {
  const token = requireEnvironmentValue(process.env, "NOTION_TOKEN");
  const databaseId = requireEnvironmentValue(process.env, "NOTION_DATABASE_ID");
  const summary = await syncNotionArticles({
    contentRoot: path.join(process.cwd(), "content", "posts"),
    databaseId,
    mode: parseSyncMode(process.argv.slice(2)),
    publicRoot: path.join(process.cwd(), "public"),
    publishedStatus: process.env.NOTION_PUBLISHED_STATUS?.trim() || "Published",
    source: new NotionApiContentSource(token),
  });
  process.stdout.write(
    `Notion articles synchronized: ${JSON.stringify(summary)}\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Notion article sync failed: ${message}\n`);
  process.exitCode = 1;
});
