import { loadArticles, loadBooks } from "@/lib/content/reader";

async function validateContent() {
  const [articles, books] = await Promise.all([loadArticles(), loadBooks()]);
  process.stdout.write(
    `Content validated: ${articles.length} articles, ${books.length} books.\n`,
  );
}

validateContent().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Content validation failed: ${message}\n`);
  process.exitCode = 1;
});
