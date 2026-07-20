import type { PageObjectResponse } from "@notionhq/client";
import { format } from "prettier";

import { analyzeMarkdown } from "@/lib/content/markdown";
import { articleFrontmatterSchema } from "@/lib/content/schema";
import { rewriteInternalPostLinks } from "@/lib/notion-sync/links";
import {
  readDate,
  readFileUrl,
  readMultiSelect,
  readRichText,
  readSelect,
  readTitle,
} from "@/lib/notion-sync/properties";
import { createNotionSlug } from "@/lib/notion-sync/slug";
import type {
  NotionArticleMetadata,
  NotionArticleState,
} from "@/lib/notion-sync/types";
import type { SiteLocale } from "@/lib/site-config";

const localeAliases = new Map<string, SiteLocale>([
  ["zh-cn", "zh-CN"],
  ["chinese", "zh-CN"],
  ["中文", "zh-CN"],
  ["en", "en"],
  ["english", "en"],
  ["英文", "en"],
]);

function required(value: string | undefined, field: string, pageId: string) {
  if (!value) {
    throw new Error(`Notion page ${pageId} is missing ${field}.`);
  }
  return value;
}

function normalizeDate(value: string, field: string, pageId: string): string {
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) {
    throw new Error(`Notion page ${pageId} has an invalid ${field}.`);
  }
  return date;
}

function resolveLocale(value: string | undefined, pageId: string): SiteLocale {
  if (!value) {
    return "zh-CN";
  }

  const locale = localeAliases.get(value.trim().toLowerCase());
  if (!locale) {
    throw new Error(
      `Notion page ${pageId} has an unsupported Locale: ${value}.`,
    );
  }
  return locale;
}

function createDescription(body: string, explicitDescription?: string): string {
  const description =
    explicitDescription?.trim() || analyzeMarkdown(body).plainText;
  if (!description) {
    throw new Error("Notion article body cannot be empty.");
  }
  return description.length > 220
    ? `${description.slice(0, 217).trimEnd()}...`
    : description;
}

export function mapNotionArticle(
  page: PageObjectResponse,
  body: string,
  existing?: NotionArticleState,
): NotionArticleMetadata {
  const normalizedBody = rewriteInternalPostLinks(body.trim());
  if (!normalizedBody) {
    throw new Error(`Notion page ${page.id} has an empty article body.`);
  }
  const title = required(readTitle(page.properties, "Title"), "Title", page.id);
  const published = normalizeDate(
    required(
      readDate(page.properties, "Published Date"),
      "Published Date",
      page.id,
    ),
    "Published Date",
    page.id,
  );
  const tags = readMultiSelect(page.properties, "Tags");
  if (tags.length === 0) {
    throw new Error(`Notion page ${page.id} must have at least one Tag.`);
  }

  const slug = createNotionSlug(
    title,
    page.id,
    readRichText(page.properties, "Slug") ?? existing?.slug,
  );
  const updated = normalizeDate(
    page.last_edited_time,
    "last edited time",
    page.id,
  );
  const translationKey =
    readRichText(page.properties, "Translation Key") ??
    existing?.translationKey;
  const frontmatter = articleFrontmatterSchema.parse({
    title,
    description: createDescription(
      normalizedBody,
      readRichText(page.properties, "Description"),
    ),
    published,
    updated: updated > published ? updated : undefined,
    locale: resolveLocale(readSelect(page.properties, "Locale"), page.id),
    tags,
    draft: false,
    pinned: false,
    translationKey,
    source: "notion",
    notionPageId: page.id,
  });
  if (frontmatter.source !== "notion" || !frontmatter.notionPageId) {
    throw new Error(`Notion page ${page.id} has an invalid source marker.`);
  }

  return {
    body: normalizedBody,
    coverUrl: readFileUrl(page.properties, "Featured Image"),
    frontmatter: {
      ...frontmatter,
      notionPageId: frontmatter.notionPageId,
      source: frontmatter.source,
    },
    pageId: page.id,
    slug,
  };
}

export async function serializeNotionArticle(
  article: NotionArticleMetadata,
): Promise<string> {
  const data = article.frontmatter;
  const lines = [
    "---",
    `title: ${JSON.stringify(data.title)}`,
    `description: ${JSON.stringify(data.description)}`,
    `published: ${JSON.stringify(data.published)}`,
  ];

  if (data.updated) lines.push(`updated: ${JSON.stringify(data.updated)}`);
  lines.push(`locale: ${JSON.stringify(data.locale)}`, "tags:");
  lines.push(...data.tags.map((tag) => `  - ${JSON.stringify(tag)}`));
  lines.push(`draft: ${String(data.draft)}`, `pinned: ${String(data.pinned)}`);
  if (data.image) lines.push(`image: ${JSON.stringify(data.image)}`);
  if (data.translationKey) {
    lines.push(`translationKey: ${JSON.stringify(data.translationKey)}`);
  }
  lines.push(
    `source: ${JSON.stringify(data.source)}`,
    `notionPageId: ${JSON.stringify(data.notionPageId)}`,
    "---",
    "",
    article.body,
    "",
  );

  return format(lines.join("\n"), {
    endOfLine: "lf",
    parser: "mdx",
    proseWrap: "preserve",
  });
}
