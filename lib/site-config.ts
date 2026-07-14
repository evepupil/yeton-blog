export const supportedLocales = ["zh-CN", "en"] as const;

export type SiteLocale = (typeof supportedLocales)[number];

export const siteConfig = {
  name: "HeroUI Blog",
  author: "林墨",
  description: "关于前端、AI 与独立开发，也记录一些慢下来的时刻。",
  defaultLocale: "zh-CN" satisfies SiteLocale,
  locales: supportedLocales,
} as const;

const localSiteUrl = "http://localhost:3000";

export function resolveSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): URL {
  const siteUrl = new URL(value ?? localSiteUrl);

  if (!new Set(["http:", "https:"]).has(siteUrl.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  return siteUrl;
}
