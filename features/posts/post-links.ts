import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

export function formatPostDate(date: string, locale: SiteLocale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function getPostHref(locale: SiteLocale, slug: string): string {
  return getLocalizedPath(`/posts/${slug}/`, locale);
}

export function decodePostSlug(segment: string): string {
  return decodeURIComponent(segment);
}
