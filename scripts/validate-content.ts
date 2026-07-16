import { loadArticles, loadBooks } from "@/lib/content/reader";
import { redirectsConfig } from "@/redirects.config";

async function validateContent() {
  const [articles, books] = await Promise.all([loadArticles(), loadBooks()]);
  const chineseSlugs = new Set(
    articles
      .filter((article) => article.locale === "zh-CN")
      .map((article) => article.slug),
  );
  for (const mapping of redirectsConfig.postSlugs) {
    if (chineseSlugs.has(mapping.from)) {
      throw new Error(
        `Legacy article still exists beside its canonical slug: ${mapping.from}`,
      );
    }
    if (!chineseSlugs.has(mapping.to)) {
      throw new Error(`Redirect target article does not exist: ${mapping.to}`);
    }
  }
  process.stdout.write(
    `Content validated: ${articles.length} articles, ${books.length} books.\n`,
  );
}

validateContent().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Content validation failed: ${message}\n`);
  process.exitCode = 1;
});
