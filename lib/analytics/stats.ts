import { getPostHref } from "@/features/posts/post-links";
import type { ResolvedUmamiConfig } from "@/lib/analytics/config";
import type { PostSlugRedirectMapping } from "@/lib/redirects/types";
import type { SiteLocale } from "@/lib/site-config";
import { redirectsConfig } from "@/redirects.config";

export interface UmamiPageStats {
  readonly pageviews: number;
  readonly visitors: number;
  readonly visits: number;
}

export interface UmamiShareData {
  readonly token: string;
  readonly websiteId: string;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNonNegativeInteger(
  value: unknown,
  field: keyof UmamiPageStats,
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Umami ${field} must be a non-negative number.`);
  }

  return Math.trunc(value);
}

export function parseUmamiShareData(
  value: unknown,
  expectedWebsiteId: string,
): UmamiShareData {
  if (!isRecord(value)) {
    throw new Error("Umami share response must be an object.");
  }

  const token = value.token;
  const websiteId = value.websiteId;
  if (typeof token !== "string" || token.length < 20) {
    throw new Error("Umami share response is missing a valid token.");
  }
  if (websiteId !== expectedWebsiteId) {
    throw new Error("Umami share response websiteId does not match config.");
  }

  return { token, websiteId };
}

export function parseUmamiPageStats(value: unknown): UmamiPageStats {
  if (!isRecord(value)) {
    throw new Error("Umami stats response must be an object.");
  }

  return {
    pageviews: readNonNegativeInteger(value.pageviews, "pageviews"),
    visitors: readNonNegativeInteger(value.visitors, "visitors"),
    visits: readNonNegativeInteger(value.visits, "visits"),
  };
}

export function sumUmamiPageStats(
  values: readonly UmamiPageStats[],
): UmamiPageStats {
  return values.reduce<UmamiPageStats>(
    (total, value) => ({
      pageviews: total.pageviews + value.pageviews,
      visitors: total.visitors + value.visitors,
      visits: total.visits + value.visits,
    }),
    { pageviews: 0, visitors: 0, visits: 0 },
  );
}

export function buildUmamiStatsUrl(
  config: ResolvedUmamiConfig,
  pathname: string,
  endAt: number,
): string {
  if (
    !pathname.startsWith("/") ||
    pathname.includes("?") ||
    pathname.includes("#")
  ) {
    throw new Error("Umami stats pathname must be an absolute URL path.");
  }
  if (!Number.isSafeInteger(endAt) || endAt <= 0) {
    throw new Error("Umami stats endAt must be a positive integer timestamp.");
  }

  const url = new URL(`websites/${config.websiteId}/stats`, config.apiBaseUrl);
  url.searchParams.set("startAt", "0");
  url.searchParams.set("endAt", String(endAt));
  url.searchParams.set("unit", "hour");
  url.searchParams.set("timezone", config.timezone);
  url.searchParams.set("path", `eq.${pathname}`);

  return url.href;
}

export function getArticleAnalyticsPaths(
  locale: SiteLocale,
  slug: string,
  mappings: readonly PostSlugRedirectMapping[] = redirectsConfig.postSlugs,
): readonly string[] {
  const paths = new Set<string>([getPostHref(locale, slug)]);

  if (locale === "en") {
    paths.add(`/posts/en/${slug}/`);
  } else {
    for (const mapping of mappings) {
      if (mapping.to === slug) {
        paths.add(`/posts/${mapping.from}/`);
      }
    }
  }

  return [...paths];
}
