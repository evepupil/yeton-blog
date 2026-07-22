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
    readString(source, "url"),
    attributes ? readString(attributes, "url") : null,
    readString(source, "path"),
    attributes ? readString(attributes, "path") : null,
    readString(source, "filename"),
    readString(source, "file_name"),
    attributes ? readString(attributes, "filename") : null,
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

interface CitationRoute {
  readonly href: string;
  readonly sourceSlug: string;
}

function createArticleHref(isEnglish: boolean, slug: string): string {
  const canonicalSlug = isEnglish
    ? slug
    : (redirectsConfig.postSlugs.find(({ from }) => from === slug)?.to ?? slug);
  const prefix = isEnglish ? "/en/posts" : "/posts";

  return `${prefix}/${canonicalSlug}/`;
}

function resolveWebRoute(segments: readonly string[]): CitationRoute | null {
  const routeSegments = [...segments];
  if (routeSegments.at(-1)?.toLocaleLowerCase("en") === "index.html") {
    routeSegments.pop();
  }

  let isEnglish = routeSegments[0]?.toLocaleLowerCase("en") === "en";
  if (isEnglish) routeSegments.shift();

  if (
    routeSegments[0]?.toLocaleLowerCase("en") === "posts" &&
    routeSegments[1]?.toLocaleLowerCase("en") === "en"
  ) {
    isEnglish = true;
    routeSegments.splice(1, 1);
  }

  const lowerSegments = routeSegments.map((segment) =>
    segment.toLocaleLowerCase("en"),
  );
  const localePrefix = isEnglish ? "/en" : "";

  if (routeSegments.length === 0) {
    return {
      href: isEnglish ? "/en/" : "/",
      sourceSlug: "homepage",
    };
  }

  const staticRoute = lowerSegments[0];
  if (
    routeSegments.length === 1 &&
    staticRoute &&
    ["about", "archives", "books", "links", "posts"].includes(staticRoute)
  ) {
    return {
      href: `${localePrefix}/${staticRoute}/`,
      sourceSlug: staticRoute,
    };
  }

  if (routeSegments.length === 2 && lowerSegments[0] === "posts") {
    const slug = routeSegments[1] ?? "";
    return isValidSlug(slug)
      ? { href: createArticleHref(isEnglish, slug), sourceSlug: slug }
      : null;
  }

  if (
    (routeSegments.length === 2 || routeSegments.length === 3) &&
    lowerSegments[0] === "books" &&
    routeSegments.slice(1).every(isValidSlug)
  ) {
    return {
      href: `${localePrefix}/${routeSegments.join("/")}/`,
      sourceSlug: routeSegments.at(-1) ?? "books",
    };
  }

  if (
    routeSegments.length === 2 &&
    lowerSegments[0] === "tags" &&
    isValidSlug(routeSegments[1] ?? "")
  ) {
    return {
      href: `${localePrefix}/tags/${routeSegments[1]}/`,
      sourceSlug: routeSegments[1] ?? "tag",
    };
  }

  return null;
}

function resolveMarkdownRoute(
  segments: readonly string[],
): CitationRoute | null {
  const filename = segments.at(-1);
  if (!filename || !/\.mdx?$/iu.test(filename)) return null;

  const routeSegments = [...segments];
  const lowerSegments = routeSegments.map((segment) =>
    segment.toLocaleLowerCase("en"),
  );
  const isEnglish = lowerSegments.includes("en");
  const sourceSlug = filename.replace(/\.mdx?$/iu, "");
  const booksIndex = lowerSegments.lastIndexOf("books");

  if (booksIndex >= 0) {
    const bookSegments = routeSegments.slice(booksIndex + 1);
    if (["en", "zh"].includes(bookSegments[0]?.toLocaleLowerCase("en") ?? "")) {
      bookSegments.shift();
    }
    if (bookSegments.length !== 2) return null;

    const [bookSlug, bookFile] = bookSegments;
    if (!bookSlug || !bookFile || !isValidSlug(bookSlug)) return null;
    const chapterSlug = bookFile.replace(/\.mdx?$/iu, "");
    if (!isValidSlug(chapterSlug)) return null;

    const localePrefix = isEnglish ? "/en" : "";
    return chapterSlug.toLocaleLowerCase("en") === "index"
      ? {
          href: `${localePrefix}/books/${bookSlug}/`,
          sourceSlug: bookSlug,
        }
      : {
          href: `${localePrefix}/books/${bookSlug}/${chapterSlug}/`,
          sourceSlug: chapterSlug,
        };
  }

  if (!isValidSlug(sourceSlug) || sourceSlug === "index") return null;
  return {
    href: createArticleHref(isEnglish, sourceSlug),
    sourceSlug,
  };
}

function parseSourceRoute(source: string): CitationRoute | null {
  const path = cleanSourcePath(source);
  const segments = path.split("/").filter(Boolean);
  const markdownSource = /\.mdx?$/iu.test(segments.at(-1) ?? "");

  return markdownSource
    ? resolveMarkdownRoute(segments)
    : resolveWebRoute(segments);
}

export function resolveCitationHref(source: string): string | null {
  const route = parseSourceRoute(source);

  return route?.href ?? null;
}

export function mapAutoRagCitations(
  sources: unknown,
  maxCitations: number,
  minimumScore = 0,
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
        href: route.href,
        sourceSlug: route.sourceSlug,
      };
      break;
    }
    if (!resolvedSource || seenHrefs.has(resolvedSource.href)) continue;

    const score = extractScore(source);
    if (score !== null && score < minimumScore) continue;

    seenHrefs.add(resolvedSource.href);
    citations.push({
      filename: resolvedSource.filename,
      href: resolvedSource.href,
      score,
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
