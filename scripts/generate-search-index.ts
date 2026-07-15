import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadArticles } from "@/lib/content/reader";
import { buildSerializedSearchAsset } from "@/lib/search/index";
import { supportedLocales } from "@/lib/site-config";

async function generateSearchIndexes() {
  const articles = await loadArticles();
  const outputDirectory = path.join(process.cwd(), "public", "search-index");
  await mkdir(outputDirectory, { recursive: true });

  await Promise.all(
    supportedLocales.map(async (locale) => {
      const asset = buildSerializedSearchAsset(articles, locale);
      const outputPath = path.join(outputDirectory, `${locale}.json`);
      await writeFile(outputPath, JSON.stringify(asset), "utf8");
    }),
  );

  console.log(
    `Search indexes generated for ${supportedLocales.length} locales.`,
  );
}

generateSearchIndexes().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
