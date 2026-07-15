import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import type { SiteLocale } from "@/lib/site-config";

export type ArticleOwnership = "missing" | "manual" | "notion";

const localeDirectories = {
  "zh-CN": "zh",
  en: "en",
} as const satisfies Record<SiteLocale, string>;

export function getArticlePath(
  contentRoot: string,
  locale: SiteLocale,
  slug: string,
): string {
  return path.join(contentRoot, localeDirectories[locale], `${slug}.mdx`);
}

export async function readArticleOwnership(
  filePath: string,
): Promise<ArticleOwnership> {
  try {
    const content = await readFile(filePath, "utf8");
    return matter(content).data.source === "notion" ? "notion" : "manual";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing";
    throw error;
  }
}

export async function writeTextIfChanged(
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    if ((await readFile(filePath, "utf8")) === content) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await writeFile(filePath, content, "utf8");
  return true;
}

export async function removeStaleNotionArticles(
  contentRoot: string,
  publicRoot: string,
  activePaths: ReadonlySet<string>,
): Promise<number> {
  const entries = await readdir(contentRoot, {
    recursive: true,
    withFileTypes: true,
  });
  let deleted = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !/\.mdx?$/u.test(entry.name)) continue;
    const filePath = path.resolve(entry.parentPath, entry.name);
    if (activePaths.has(filePath)) continue;
    if ((await readArticleOwnership(filePath)) !== "notion") continue;

    const slug = path.basename(filePath, path.extname(filePath));
    await Promise.all([
      rm(filePath),
      rm(path.join(publicRoot, "images", "notion", slug), {
        force: true,
        recursive: true,
      }),
    ]);
    deleted += 1;
  }
  return deleted;
}
