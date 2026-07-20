import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import { redirectsConfig } from "@/redirects.config";

const internalOrigins = new Set([
  "https://blog.chaosyn.com",
  "https://blog1.chaosyn.com",
]);
const redirectedPostSlugs = new Map<string, string>(
  redirectsConfig.postSlugs.map(({ from, to }) => [from, to]),
);

interface Replacement {
  readonly end: number;
  readonly start: number;
  readonly value: string;
}

function decodePathname(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function resolveCanonicalPostHref(href: string): string | null {
  const isRootRelative = href.startsWith("/");
  let url: URL;
  try {
    url = new URL(href, "https://blog1.chaosyn.com");
  } catch {
    return null;
  }
  if (!isRootRelative && !internalOrigins.has(url.origin)) return null;

  const pathname = decodePathname(url.pathname);
  const match = pathname?.match(/^\/posts\/([^/]+)\/?$/u);
  if (!match) return null;
  const legacySlug = match[1];
  if (!legacySlug) return null;
  const canonicalSlug = redirectedPostSlugs.get(legacySlug);
  if (!canonicalSlug) return null;

  return `/posts/${canonicalSlug}/${url.search}${url.hash}`;
}

export function rewriteInternalPostLinks(markdown: string): string {
  const tree = unified().use(remarkParse).parse(markdown);
  const replacements: Replacement[] = [];

  visit(tree, "link", (node) => {
    const canonicalHref = resolveCanonicalPostHref(node.url);
    if (!canonicalHref) return;
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) {
      throw new Error("Markdown link is missing source offsets.");
    }

    const source = markdown.slice(start, end);
    const relativeUrlStart = source.lastIndexOf(node.url);
    if (relativeUrlStart < 0) {
      throw new Error(`Markdown link source does not contain ${node.url}.`);
    }
    const urlStart = start + relativeUrlStart;
    replacements.push({
      end: urlStart + node.url.length,
      start: urlStart,
      value: canonicalHref,
    });
  });

  return replacements
    .toSorted((left, right) => right.start - left.start)
    .reduce(
      (result, replacement) =>
        `${result.slice(0, replacement.start)}${replacement.value}${result.slice(replacement.end)}`,
      markdown,
    );
}
