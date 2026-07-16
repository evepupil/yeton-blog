import { resolveUmamiConfig } from "@/lib/analytics/config";
import {
  buildUmamiStatsUrl,
  parseUmamiPageStats,
  parseUmamiShareData,
  sumUmamiPageStats,
  type UmamiPageStats,
  type UmamiShareData,
} from "@/lib/analytics/stats";

const analytics = resolveUmamiConfig();
const shareCacheDurationMs = 24 * 60 * 60 * 1000;
const statsCacheDurationMs = 60 * 60 * 1000;
const shareContextHeaders = {
  Accept: "application/json",
  "x-umami-share-context": "1",
} as const;

interface CacheEntry<T> {
  readonly expiresAt: number;
  readonly value: T;
}

interface HttpError extends Error {
  readonly status: number;
}

const statsRequests = new Map<string, Promise<UmamiPageStats>>();
let shareRequest: Promise<UmamiShareData> | null = null;

function createHttpError(status: number): HttpError {
  return Object.assign(new Error(`Umami request failed with HTTP ${status}.`), {
    status,
  });
}

function readCache<T>(
  key: string,
  parseValue: (value: unknown) => T,
): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as unknown;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      localStorage.removeItem(key);
      return null;
    }
    const expiresAt = Reflect.get(entry, "expiresAt");
    if (typeof expiresAt !== "number" || expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }

    return parseValue(Reflect.get(entry, "value"));
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T, durationMs: number): void {
  try {
    const entry: CacheEntry<T> = {
      expiresAt: Date.now() + durationMs,
      value,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage can be unavailable in private browsing; in-memory requests still deduplicate.
  }
}

function getShareCacheKey(): string {
  return `hero-ui-blog:umami:share:${analytics?.shareApiUrl ?? "disabled"}`;
}

function getStatsCacheKey(paths: readonly string[]): string {
  return `hero-ui-blog:umami:stats:${encodeURIComponent(paths.join("|"))}`;
}

async function requestShareData(forceRefresh = false): Promise<UmamiShareData> {
  if (!analytics || !analytics.shareApiUrl) {
    throw new Error("Umami page view configuration is unavailable.");
  }

  const cacheKey = getShareCacheKey();
  if (forceRefresh) {
    shareRequest = null;
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // The retry can continue without browser storage.
    }
  } else {
    const cached = readCache(cacheKey, (value) =>
      parseUmamiShareData(value, analytics.websiteId),
    );
    if (cached) return cached;
  }

  shareRequest ??= fetch(analytics.shareApiUrl, {
    cache: "no-store",
    credentials: "omit",
    headers: shareContextHeaders,
    referrerPolicy: "no-referrer",
  }).then(async (response) => {
    if (!response.ok) throw createHttpError(response.status);
    const share = parseUmamiShareData(
      await response.json(),
      analytics.websiteId,
    );
    writeCache(cacheKey, share, shareCacheDurationMs);
    return share;
  });

  try {
    return await shareRequest;
  } catch (error: unknown) {
    shareRequest = null;
    throw error;
  }
}

async function requestPathStats(
  pathname: string,
  share: UmamiShareData,
): Promise<UmamiPageStats> {
  if (!analytics) {
    throw new Error("Umami page view configuration is unavailable.");
  }

  const response = await fetch(
    buildUmamiStatsUrl(analytics, pathname, Date.now()),
    {
      cache: "no-store",
      credentials: "omit",
      headers: {
        ...shareContextHeaders,
        "x-umami-share-token": share.token,
      },
      referrerPolicy: "no-referrer",
    },
  );
  if (!response.ok) throw createHttpError(response.status);

  return parseUmamiPageStats(await response.json());
}

async function requestAllPathStats(
  paths: readonly string[],
  forceRefreshShare = false,
): Promise<UmamiPageStats> {
  const share = await requestShareData(forceRefreshShare);
  const values = await Promise.all(
    paths.map((pathname) => requestPathStats(pathname, share)),
  );
  return sumUmamiPageStats(values);
}

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof Error &&
    "status" in error &&
    Reflect.get(error, "status") === 401
  );
}

export async function loadArticleStats(
  paths: readonly string[],
): Promise<UmamiPageStats> {
  const cacheKey = getStatsCacheKey(paths);
  const cached = readCache(cacheKey, parseUmamiPageStats);
  if (cached) return cached;

  let request = statsRequests.get(cacheKey);
  if (!request) {
    request = requestAllPathStats(paths)
      .catch((error: unknown) => {
        if (isUnauthorized(error)) {
          return requestAllPathStats(paths, true);
        }
        throw error;
      })
      .then((stats) => {
        writeCache(cacheKey, stats, statsCacheDurationMs);
        return stats;
      })
      .finally(() => {
        statsRequests.delete(cacheKey);
      });
    statsRequests.set(cacheKey, request);
  }

  return request;
}
