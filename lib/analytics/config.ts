import { siteConfig } from "@/site.config";
import type {
  GoogleAnalyticsConfig,
  UmamiAnalyticsConfig,
} from "@/site.config";

export interface ResolvedUmamiConfig {
  readonly apiBaseUrl: string;
  readonly pageViewsEnabled: boolean;
  readonly scriptUrl: string;
  readonly shareApiUrl: string;
  readonly shareUrl: string | null;
  readonly timezone: string;
  readonly websiteId: string;
}

export interface ResolvedGoogleAnalyticsConfig {
  readonly measurementId: string;
  readonly scriptUrl: string;
}

const websiteIdPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/iu;
const shareIdPattern = /^[A-Za-z0-9_-]+$/u;
const measurementIdPattern = /^G-[A-Z0-9]+$/u;

function validateTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
  } catch {
    throw new Error("Umami timezone must be a valid IANA timezone.");
  }
}

function resolveApiBaseUrl(baseUrl: URL, apiPath: string): URL {
  if (!apiPath.startsWith("/") || apiPath.startsWith("//")) {
    throw new Error("Umami apiPath must be an absolute site path.");
  }

  const apiBaseUrl = new URL(`${apiPath.replace(/\/+$/u, "")}/`, baseUrl);
  if (apiBaseUrl.origin !== baseUrl.origin) {
    throw new Error("Umami apiPath must stay on the configured host.");
  }

  return apiBaseUrl;
}

export function resolveUmamiConfig(
  config: UmamiAnalyticsConfig = siteConfig.integrations.analytics,
): ResolvedUmamiConfig | null {
  if (!config.enabled) {
    return null;
  }
  if (config.provider !== "umami") {
    throw new Error("Analytics provider must be umami.");
  }

  const baseUrl = new URL(config.baseUrl);
  if (baseUrl.protocol !== "https:") {
    throw new Error("Umami baseUrl must use https.");
  }
  if (!websiteIdPattern.test(config.websiteId)) {
    throw new Error("Umami websiteId must be a UUID.");
  }
  if (config.shareId && !shareIdPattern.test(config.shareId)) {
    throw new Error("Umami shareId contains unsupported characters.");
  }
  if (config.showPageViews && !config.shareId) {
    throw new Error("Umami shareId is required to show page views.");
  }
  validateTimezone(config.timezone);
  const apiBaseUrl = resolveApiBaseUrl(baseUrl, config.apiPath);

  return {
    apiBaseUrl: apiBaseUrl.href,
    pageViewsEnabled: config.showPageViews,
    scriptUrl: new URL("/script.js", baseUrl).href,
    shareApiUrl: config.shareId
      ? new URL(`share/${config.shareId}`, apiBaseUrl).href
      : "",
    shareUrl: config.shareId
      ? new URL(`/share/${config.shareId}`, baseUrl).href
      : null,
    timezone: config.timezone,
    websiteId: config.websiteId,
  };
}

export function resolveGoogleAnalyticsConfig(
  config: GoogleAnalyticsConfig = siteConfig.integrations.googleAnalytics,
): ResolvedGoogleAnalyticsConfig | null {
  if (!config.enabled) {
    return null;
  }
  if (!measurementIdPattern.test(config.measurementId)) {
    throw new Error("Google Analytics measurementId must use the G- format.");
  }

  return {
    measurementId: config.measurementId,
    scriptUrl: `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`,
  };
}
