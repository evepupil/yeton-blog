import path from "node:path";

import { config } from "dotenv";

import { NotionApiContentSource } from "@/lib/notion-sync/client";
import { requireEnvironmentValue } from "@/lib/notion-sync/config";
import { syncNotionFriends } from "@/lib/notion-sync/sync";

if (!process.env.CI) {
  config({ path: ".env.local", quiet: true });
  config({ quiet: true });
}

async function main() {
  const databaseId = process.env.NOTION_FRIEND_LINK_DATABASE_ID?.trim();
  if (!databaseId) {
    process.stdout.write(
      "NOTION_FRIEND_LINK_DATABASE_ID is not configured; friend sync skipped.\n",
    );
    return;
  }
  const token = requireEnvironmentValue(process.env, "NOTION_TOKEN");
  const result = await syncNotionFriends({
    databaseId,
    outputPath: path.join(process.cwd(), "data", "friends.json"),
    publicRoot: path.join(process.cwd(), "public"),
    source: new NotionApiContentSource(token),
  });
  process.stdout.write(
    `Notion friends synchronized: ${JSON.stringify(result)}\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Notion friend sync failed: ${message}\n`);
  process.exitCode = 1;
});
