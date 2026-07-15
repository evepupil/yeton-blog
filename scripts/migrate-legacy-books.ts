import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { format } from "prettier";

import {
  migrateLegacyBook,
  type LegacyBookChapterSource,
} from "@/lib/content/legacy-book-migration";

const bookSlugOverrides = new Map([
  ["《Tae Kim日语语法指南》中文翻译版", "tae-kim-japanese-grammar-guide"],
]);
const bookOrder = new Map([
  ["ai-engineering", 1],
  ["claude-code-advanced", 2],
  ["tae-kim-japanese-grammar-guide", 3],
]);

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function assertReplaceFlag(): void {
  if (!process.argv.includes("--replace")) {
    throw new Error(
      "Legacy book migration replaces content/books. Re-run with --replace after reviewing the source path.",
    );
  }
}

function assertProjectTarget(target: string): void {
  const expected = path.resolve("content", "books");
  if (path.resolve(target) !== expected) {
    throw new Error(`Refusing to replace unexpected target: ${target}`);
  }
}

function getBookSlug(directoryName: string): string {
  const overridden = bookSlugOverrides.get(directoryName);
  if (overridden) {
    return overridden;
  }

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(directoryName)) {
    return directoryName;
  }

  throw new Error(
    `Legacy book directory requires an explicit slug override: ${directoryName}`,
  );
}

async function loadChapters(
  directory: string,
): Promise<LegacyBookChapterSource[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        entry.name !== "index.md",
    )
    .map((entry) => entry.name)
    .toSorted();

  return Promise.all(
    files.map(async (fileName) => ({
      fileName,
      raw: await readFile(path.join(directory, fileName), "utf8"),
    })),
  );
}

async function main(): Promise<void> {
  assertReplaceFlag();
  const source = getArgument("--source");
  if (!source) {
    throw new Error("Pass the legacy repository with --source <path>.");
  }

  const sourceBooksRoot = path.resolve(source, "src", "content", "books");
  const targetBooksRoot = path.resolve("content", "books");
  assertProjectTarget(targetBooksRoot);

  const directories = (await readdir(sourceBooksRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted((left, right) => left.localeCompare(right, "en"));
  const migratedBooks = await Promise.all(
    directories.map(async (directoryName) => {
      const directory = path.join(sourceBooksRoot, directoryName);
      const slug = getBookSlug(directoryName);
      const order = bookOrder.get(slug);
      if (order === undefined) {
        throw new Error(`Legacy book requires an explicit order: ${slug}`);
      }

      return migrateLegacyBook({
        chapters: await loadChapters(directory),
        indexRaw: await readFile(path.join(directory, "index.md"), "utf8"),
        order,
        slug,
      });
    }),
  );

  await rm(targetBooksRoot, { force: true, recursive: true });
  await Promise.all([
    mkdir(path.join(targetBooksRoot, "zh"), { recursive: true }),
    mkdir(path.join(targetBooksRoot, "en"), { recursive: true }),
  ]);
  await Promise.all(
    migratedBooks.map(async (book) =>
      writeFile(
        path.join(
          targetBooksRoot,
          book.frontmatter.locale === "en" ? "en" : "zh",
          `${book.slug}.md`,
        ),
        await format(book.content, {
          endOfLine: "lf",
          parser: "markdown",
          proseWrap: "preserve",
        }),
        "utf8",
      ),
    ),
  );

  const chapterCount = migratedBooks.reduce(
    (total, book) => total + book.chapterCount,
    0,
  );
  console.log(
    `Migrated ${migratedBooks.length} books with ${chapterCount} published chapters.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
