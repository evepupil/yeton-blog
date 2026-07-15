import { resolveSiteUrl } from "@/lib/site-config";

export interface DeploymentEnvironment {
  readonly accountId: string;
  readonly apiToken: string;
  readonly pagesProject: string;
  readonly siteUrl: URL;
}

type EnvironmentValues = Readonly<Record<string, string | undefined>>;

const blockedHostnames = new Set([
  "127.0.0.1",
  "::1",
  "example.com",
  "localhost",
]);

function requireEnvironmentValue(
  environment: EnvironmentValues,
  name: string,
): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for a production deployment.`);
  }

  return value;
}

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

export function readDeploymentEnvironment(
  environment: EnvironmentValues = process.env,
): DeploymentEnvironment {
  const accountId = requireEnvironmentValue(
    environment,
    "CLOUDFLARE_ACCOUNT_ID",
  );
  const apiToken = requireEnvironmentValue(environment, "CLOUDFLARE_API_TOKEN");
  const pagesProject = requireEnvironmentValue(
    environment,
    "CLOUDFLARE_PAGES_PROJECT",
  );

  if (!/^[a-f0-9]{32}$/iu.test(accountId)) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID must be a 32-character hex ID.");
  }
  if (apiToken.length < 20) {
    throw new Error("CLOUDFLARE_API_TOKEN is not a valid API token.");
  }
  if (!/^[a-z0-9][a-z0-9-]{0,57}[a-z0-9]$/u.test(pagesProject)) {
    throw new Error(
      "CLOUDFLARE_PAGES_PROJECT must be a lowercase Cloudflare project name.",
    );
  }

  return {
    accountId,
    apiToken,
    pagesProject,
    siteUrl: resolveProductionSiteUrl(environment.NEXT_PUBLIC_SITE_URL),
  };
}
