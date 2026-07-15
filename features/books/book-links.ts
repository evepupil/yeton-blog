import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

export function getBookHref(locale: SiteLocale, slug: string): string {
  return getLocalizedPath(`/books/${slug}/`, locale);
}
