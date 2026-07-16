import type { AiSearchCitation } from "@/lib/ai-search/types";
import { redirectsConfig } from "@/redirects.config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cleanSourcePath(filename: string): string {
  return (
    decodePath(filename)
      .replace(/\\/gu, "/")
      .split(/[?#]/u, 1)[0]
      ?.replace(/^\/+|\/+$/gu, "") ?? ""
  );
}

function extractSourceFilename(source: Record<string, unknown>): string | null {
  const attributes = isRecord(source.attributes) ? source.attributes : null;
  return (
    readString(source, "filename") ??
    readString(source, "file_name") ??
    readString(source, "path") ??
    (attributes
      ? (readString(attributes, "filename") ?? readString(attributes, "path"))
      : null)
  );
}

function extractSourceTitle(
  source: Record<string, unknown>,
  fallbackSlug: string,
): string {
  const attributes = isRecord(source.attributes) ? source.attributes : null;
  const configuredTitle =
    readString(source, "title") ??
    (attributes ? readString(attributes, "title") : null);

  if (configuredTitle) return configuredTitle;

  return fallbackSlug
    .replace(/-[a-f0-9]{8}$/iu, "")
    .replace(/[-_]+/gu, " ")
    .trim();
}

function extractScore(source: Record<string, unknown>): number | null {
  const score = source.score;
  return typeof score === "number" && Number.isFinite(score)
    ? Math.min(1, Math.max(0, score))
    : null;
}

export function resolveCitationHref(filename: string): string | null {
  const path = cleanSourcePath(filename);
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);
  if (!lastSegment || !/\.mdx?$/iu.test(lastSegment)) return null;

  const sourceSlug = lastSegment.replace(/\.mdx?$/iu, "");
  if (!sourceSlug || /[\s/?#]/u.test(sourceSlug)) return null;

  const canonicalSlug =
    redirectsConfig.postSlugs.find(({ from }) => from === sourceSlug)?.to ??
    sourceSlug;
  const isEnglish = segments.some(
    (segment) => segment.toLocaleLowerCase("en") === "en",
  );
  const prefix = isEnglish ? "/en/posts" : "/posts";

  return `${prefix}/${canonicalSlug}/`;
}

export function mapAutoRagCitations(
  sources: unknown,
  maxCitations: number,
): readonly AiSearchCitation[] {
  if (!Array.isArray(sources) || maxCitations <= 0) return [];

  const citations: AiSearchCitation[] = [];
  const seenHrefs = new Set<string>();

  for (const source of sources) {
    if (!isRecord(source)) continue;

    const filename = extractSourceFilename(source);
    if (!filename) continue;
    const href = resolveCitationHref(filename);
    if (!href || seenHrefs.has(href)) continue;

    const sourceSlug = cleanSourcePath(filename)
      .split("/")
      .at(-1)
      ?.replace(/\.mdx?$/iu, "");
    if (!sourceSlug) continue;

    seenHrefs.add(href);
    citations.push({
      filename,
      href,
      score: extractScore(source),
      title: extractSourceTitle(source, sourceSlug),
    });
    if (citations.length >= maxCitations) break;
  }

  return citations;
}
