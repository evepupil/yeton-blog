import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import {
  getLegacyAssetPath,
  migrateLegacyFrontmatter,
  migrateLegacyMarkdown,
  parseLegacyArticle,
  serializeMigratedArticle,
} from "@/lib/content/legacy-migration";

interface SourceArticle {
  readonly content: string;
  readonly data: Record<string, unknown>;
  readonly relativePath: string;
}

interface MigratedArticle {
  readonly assetPaths: readonly string[];
  readonly content: string;
  readonly destinationPath: string;
}

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function assertReplaceFlag(): void {
  if (!process.argv.includes("--replace")) {
    throw new Error(
      "Legacy migration replaces content/posts. Re-run with --replace after reviewing the source path.",
    );
  }
}

function assertProjectTarget(
  target: string,
  expectedRelativePath: string,
): void {
  const expected = path.resolve(process.cwd(), expectedRelativePath);
  if (path.resolve(target) !== expected) {
    throw new Error(`Refusing to replace unexpected target: ${target}`);
  }
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? listMarkdownFiles(entryPath)
        : Promise.resolve(entryPath.endsWith(".md") ? [entryPath] : []);
    }),
  );

  return nested.flat().toSorted();
}

async function loadSourceArticles(postsRoot: string): Promise<SourceArticle[]> {
  const files = await listMarkdownFiles(postsRoot);
  return Promise.all(
    files.map(async (filePath) => {
      const parsed = parseLegacyArticle(await readFile(filePath, "utf8"));
      return {
        content: parsed.content,
        data: parsed.data,
        relativePath: path.relative(postsRoot, filePath),
      };
    }),
  );
}

function findPairedTranslationKeys(
  articles: readonly SourceArticle[],
): ReadonlySet<string> {
  const localesByKey = new Map<string, Set<string>>();

  for (const article of articles) {
    const key = article.data.translationKey;
    const locale = article.data.lang;
    if (typeof key !== "string" || !key || typeof locale !== "string") {
      continue;
    }

    const locales = localesByKey.get(key) ?? new Set<string>();
    locales.add(locale);
    localesByKey.set(key, locales);
  }

  return new Set(
    Array.from(localesByKey)
      .filter(([, locales]) => locales.size >= 2)
      .map(([key]) => key),
  );
}

function migrateArticles(
  articles: readonly SourceArticle[],
  pairedTranslationKeys: ReadonlySet<string>,
  targetPostsRoot: string,
): MigratedArticle[] {
  return articles.map((article) => {
    const frontmatter = migrateLegacyFrontmatter(
      article.data,
      pairedTranslationKeys,
    );
    const body = migrateLegacyMarkdown(article.content);
    const coverAsset = article.data.image;
    const coverPath =
      typeof coverAsset === "string" ? getLegacyAssetPath(coverAsset) : null;
    const slug = path.basename(article.relativePath, ".md");
    const localeDirectory = frontmatter.locale === "en" ? "en" : "zh";

    return {
      assetPaths: coverPath
        ? Array.from(new Set([...body.assetPaths, coverPath])).toSorted()
        : body.assetPaths,
      content: serializeMigratedArticle(frontmatter, body.markdown),
      destinationPath: path.join(
        targetPostsRoot,
        localeDirectory,
        `${slug}.md`,
      ),
    };
  });
}

async function verifyAssets(
  sourceAssetsRoot: string,
  assetPaths: readonly string[],
): Promise<void> {
  await Promise.all(
    assetPaths.map(async (assetPath) => {
      const sourcePath = path.resolve(sourceAssetsRoot, assetPath);
      if (
        !sourcePath.startsWith(`${path.resolve(sourceAssetsRoot)}${path.sep}`)
      ) {
        throw new Error(`Asset escapes the legacy image root: ${assetPath}`);
      }
      await access(sourcePath);
    }),
  );
}

async function writeMigration(
  articles: readonly MigratedArticle[],
  sourceAssetsRoot: string,
  targetPostsRoot: string,
  targetAssetsRoot: string,
): Promise<void> {
  assertProjectTarget(targetPostsRoot, path.join("content", "posts"));
  assertProjectTarget(targetAssetsRoot, path.join("public", "images", "posts"));

  const assetPaths = Array.from(
    new Set(articles.flatMap((article) => article.assetPaths)),
  ).toSorted();
  await verifyAssets(sourceAssetsRoot, assetPaths);

  await rm(targetPostsRoot, { force: true, recursive: true });
  await rm(targetAssetsRoot, { force: true, recursive: true });
  await Promise.all([
    mkdir(path.join(targetPostsRoot, "zh"), { recursive: true }),
    mkdir(path.join(targetPostsRoot, "en"), { recursive: true }),
    mkdir(targetAssetsRoot, { recursive: true }),
  ]);

  await Promise.all(
    articles.map(async (article) => {
      await mkdir(path.dirname(article.destinationPath), { recursive: true });
      await writeFile(article.destinationPath, article.content, "utf8");
    }),
  );
  await Promise.all(
    assetPaths.map(async (assetPath) => {
      const destination = path.join(targetAssetsRoot, assetPath);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(path.join(sourceAssetsRoot, assetPath), destination);
    }),
  );

  console.log(
    `Migrated ${articles.length} articles and ${assetPaths.length} referenced images.`,
  );
}

async function main(): Promise<void> {
  assertReplaceFlag();
  const source = getArgument("--source");
  if (!source) {
    throw new Error("Pass the legacy repository with --source <path>.");
  }

  const sourceRoot = path.resolve(source);
  const sourcePostsRoot = path.join(sourceRoot, "src", "content", "posts");
  const sourceAssetsRoot = path.join(
    sourceRoot,
    "src",
    "content",
    "assets",
    "images",
  );
  const targetPostsRoot = path.resolve("content", "posts");
  const targetAssetsRoot = path.resolve("public", "images", "posts");
  const sourceArticles = await loadSourceArticles(sourcePostsRoot);
  const pairedTranslationKeys = findPairedTranslationKeys(sourceArticles);
  const articles = migrateArticles(
    sourceArticles,
    pairedTranslationKeys,
    targetPostsRoot,
  );

  await writeMigration(
    articles,
    sourceAssetsRoot,
    targetPostsRoot,
    targetAssetsRoot,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
