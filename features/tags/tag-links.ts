import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

export function getTagHref(locale: SiteLocale, tag: string): string {
  return getLocalizedPath(`/tags/${tag}/`, locale);
}

export function decodeTagSegment(segment: string): string {
  return decodeURIComponent(segment);
}
