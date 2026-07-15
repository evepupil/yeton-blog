import { siteConfig } from "@/site.config";
import type { UmamiAnalyticsConfig } from "@/site.config";

export interface ResolvedUmamiConfig {
  readonly scriptUrl: string;
  readonly shareUrl: string | null;
  readonly websiteId: string;
}

const websiteIdPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/iu;
const shareIdPattern = /^[A-Za-z0-9_-]+$/u;

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

  return {
    scriptUrl: new URL("/script.js", baseUrl).href,
    shareUrl: config.shareId
      ? new URL(`/share/${config.shareId}`, baseUrl).href
      : null,
    websiteId: config.websiteId,
  };
}
