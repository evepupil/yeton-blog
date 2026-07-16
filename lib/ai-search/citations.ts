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

function cleanSourcePath(source: string): string {
  const value = source.trim();
  let path = value.split(/[?#]/u, 1)[0] ?? "";

  if (/^https?:\/\//iu.test(value)) {
    try {
      path = new URL(value).pathname;
    } catch {
      return "";
    }
  }

  return decodePath(path)
    .replace(/\\/gu, "/")
    .replace(/^\/+|\/+$/gu, "");
}

function extractSourceLocations(
  source: Record<string, unknown>,
): readonly string[] {
  const attributes = isRecord(source.attributes) ? source.attributes : null;
  const locations = [
    readString(source, "filename"),
    readString(source, "file_name"),
    readString(source, "path"),
    readString(source, "url"),
    attributes ? readString(attributes, "filename") : null,
    attributes ? readString(attributes, "path") : null,
    attributes ? readString(attributes, "url") : null,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(locations)];
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

function isValidSlug(value: string): boolean {
  return Boolean(value) && !/[\s/?#]/u.test(value);
}

function resolveWebRoute(
  segments: readonly string[],
): { readonly isEnglish: boolean; readonly slug: string } | null {
  const routeSegments = [...segments];
  if (routeSegments.at(-1)?.toLocaleLowerCase("en") === "index.html") {
    routeSegments.pop();
  }

  const lowerSegments = routeSegments.map((segment) =>
    segment.toLocaleLowerCase("en"),
  );
  if (
    routeSegments.length === 3 &&
    lowerSegments[0] === "en" &&
    lowerSegments[1] === "posts"
  ) {
    return { isEnglish: true, slug: routeSegments[2] ?? "" };
  }
  if (
    routeSegments.length === 3 &&
    lowerSegments[0] === "posts" &&
    lowerSegments[1] === "en"
  ) {
    return { isEnglish: true, slug: routeSegments[2] ?? "" };
  }
  if (routeSegments.length === 2 && lowerSegments[0] === "posts") {
    return { isEnglish: false, slug: routeSegments[1] ?? "" };
  }

  return null;
}

function parseSourceRoute(
  source: string,
): { readonly isEnglish: boolean; readonly slug: string } | null {
  const path = cleanSourcePath(source);
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);
  if (!lastSegment) return null;

  const markdownSource = /\.mdx?$/iu.test(lastSegment);
  const webRoute = markdownSource ? null : resolveWebRoute(segments);
  const sourceSlug = markdownSource
    ? lastSegment.replace(/\.mdx?$/iu, "")
    : webRoute?.slug;
  if (!sourceSlug || !isValidSlug(sourceSlug)) return null;

  const isEnglish =
    webRoute?.isEnglish ??
    segments.some((segment) => segment.toLocaleLowerCase("en") === "en");

  return { isEnglish, slug: sourceSlug };
}

function createCitationHref({
  isEnglish,
  slug,
}: {
  readonly isEnglish: boolean;
  readonly slug: string;
}): string {
  const canonicalSlug = isEnglish
    ? slug
    : (redirectsConfig.postSlugs.find(({ from }) => from === slug)?.to ?? slug);
  const prefix = isEnglish ? "/en/posts" : "/posts";

  return `${prefix}/${canonicalSlug}/`;
}

export function resolveCitationHref(source: string): string | null {
  const route = parseSourceRoute(source);

  return route ? createCitationHref(route) : null;
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

    let resolvedSource:
      | {
          readonly filename: string;
          readonly href: string;
          readonly sourceSlug: string;
        }
      | undefined;
    for (const filename of extractSourceLocations(source)) {
      const route = parseSourceRoute(filename);
      if (!route) continue;
      resolvedSource = {
        filename,
        href: createCitationHref(route),
        sourceSlug: route.slug,
      };
      break;
    }
    if (!resolvedSource || seenHrefs.has(resolvedSource.href)) continue;

    seenHrefs.add(resolvedSource.href);
    citations.push({
      filename: resolvedSource.filename,
      href: resolvedSource.href,
      score: extractScore(source),
      title: extractSourceTitle(source, resolvedSource.sourceSlug),
    });
    if (citations.length >= maxCitations) break;
  }

  return citations;
}

export function extractAutoRagSources(result: unknown): unknown {
  if (!isRecord(result)) return [];
  if (Array.isArray(result.data)) return result.data;
  if (isRecord(result.result) && Array.isArray(result.result.data)) {
    return result.result.data;
  }
  return [];
}
