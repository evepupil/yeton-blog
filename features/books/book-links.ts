import { getLocalizedPath } from "@/lib/i18n";
import type { SiteLocale } from "@/lib/site-config";

export function decodeBookSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function getBookHref(locale: SiteLocale, slug: string): string {
  return getLocalizedPath(`/books/${slug}/`, locale);
}

export function getBookChapterHref(
  locale: SiteLocale,
  bookSlug: string,
  chapterSlug: string,
): string {
  return getLocalizedPath(`/books/${bookSlug}/${chapterSlug}/`, locale);
}

export function formatBookDate(date: string, locale: SiteLocale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
