import { resolveSiteUrl } from "@/lib/site-config";

type EnvironmentValues = Readonly<Record<string, string | undefined>>;

const blockedHostnames = new Set([
  "127.0.0.1",
  "::1",
  "example.com",
  "localhost",
]);

export function resolveProductionSiteUrl(value: string | undefined): URL {
  if (!value?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is required for a production deployment.",
    );
  }

  const siteUrl = resolveSiteUrl(value);
  const hostname = siteUrl.hostname.toLowerCase();

  if (siteUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use https in production.");
  }
  if (
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".example.com") ||
    hostname.endsWith(".localhost")
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must use the real public production hostname.",
    );
  }
  if (
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.pathname !== "/" ||
    siteUrl.search ||
    siteUrl.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be an origin without credentials, path, query, or hash.",
    );
  }

  return siteUrl;
}

export function resolveCloudflareBuildSiteUrl(
  environment: EnvironmentValues = process.env,
): URL | null {
  if (environment.CF_PAGES !== "1") {
    return null;
  }

  return resolveProductionSiteUrl(environment.NEXT_PUBLIC_SITE_URL);
}
