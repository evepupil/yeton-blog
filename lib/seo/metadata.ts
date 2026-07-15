import type { Metadata, Viewport } from "next";

import { getLocalizedPath, stripLocalePrefix } from "@/lib/i18n";
import {
  getLocalizedSiteConfig,
  resolveSiteUrl,
  siteConfig,
} from "@/lib/site-config";
import type { SiteLocale } from "@/lib/site-config";

export type LocalePathMap = Partial<Readonly<Record<SiteLocale, string>>>;

interface PageMetadataOptions {
  readonly alternatePaths?: LocalePathMap;
  readonly description: string;
  readonly image?: string;
  readonly locale: SiteLocale;
  readonly noIndex?: boolean;
  readonly pathname: string;
  readonly title?: string;
}

const localeMetadata = {
  "zh-CN": {
    description: siteConfig.brand.description["zh-CN"],
    name: siteConfig.brand.name["zh-CN"],
    openGraphLocale: "zh_CN",
    rssTitle: `${siteConfig.brand.name["zh-CN"]} RSS`,
  },
  en: {
    description: siteConfig.brand.description.en,
    name: siteConfig.brand.name.en,
    openGraphLocale: "en_US",
    rssTitle: `${siteConfig.brand.name.en} RSS`,
  },
} as const satisfies Record<SiteLocale, object>;

export const siteViewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151817" },
  ],
};

export function getAbsoluteUrl(pathname: string): URL {
  return new URL(pathname, resolveSiteUrl());
}

export function getLocaleSiteName(locale: SiteLocale): string {
  return localeMetadata[locale].name;
}

export function getLocaleDescription(locale: SiteLocale): string {
  return localeMetadata[locale].description;
}

export function getDefaultLocalePaths(pathname: string): LocalePathMap {
  const basePath = stripLocalePrefix(pathname);

  return {
    "zh-CN": getLocalizedPath(basePath, "zh-CN"),
    en: getLocalizedPath(basePath, "en"),
  };
}

function buildAlternates(
  locale: SiteLocale,
  pathname: string,
  alternatePaths: LocalePathMap,
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, URL> = {};

  for (const [language, path] of Object.entries(alternatePaths)) {
    if (path) {
      languages[language] = getAbsoluteUrl(path);
    }
  }

  const defaultPath = alternatePaths["zh-CN"];
  if (defaultPath) {
    languages["x-default"] = getAbsoluteUrl(defaultPath);
  }

  const rssPath = getLocalizedPath("/rss.xml", locale);

  return {
    canonical: getAbsoluteUrl(pathname),
    languages,
    types: {
      "application/rss+xml": [
        {
          title: localeMetadata[locale].rssTitle,
          url: getAbsoluteUrl(rssPath),
        },
      ],
    },
  };
}

function getSocialTitle(locale: SiteLocale, title?: string): string {
  const siteName = getLocaleSiteName(locale);
  return title ? `${title} | ${siteName}` : siteName;
}

export function buildRootMetadata(locale: SiteLocale): Metadata {
  const details = localeMetadata[locale];
  const identity = getLocalizedSiteConfig(locale);

  return {
    applicationName: details.name,
    authors: [{ name: identity.authorName }],
    creator: identity.authorName,
    description: details.description,
    metadataBase: resolveSiteUrl(),
    openGraph: {
      description: details.description,
      images: [{ url: getAbsoluteUrl(siteConfig.brand.socialImage) }],
      locale: details.openGraphLocale,
      siteName: details.name,
      title: details.name,
      type: "website",
    },
    publisher: identity.authorName,
    title: {
      default: details.name,
      template: `%s | ${details.name}`,
    },
    twitter: {
      card: "summary_large_image",
      description: details.description,
      images: [getAbsoluteUrl(siteConfig.brand.socialImage)],
      title: details.name,
    },
  };
}

export function buildPageMetadata({
  alternatePaths,
  description,
  image = siteConfig.brand.socialImage,
  locale,
  noIndex = false,
  pathname,
  title,
}: PageMetadataOptions): Metadata {
  const details = localeMetadata[locale];
  const socialTitle = getSocialTitle(locale, title);
  const resolvedAlternates = alternatePaths ?? getDefaultLocalePaths(pathname);

  return {
    alternates: buildAlternates(locale, pathname, resolvedAlternates),
    description,
    openGraph: {
      alternateLocale: Object.values(localeMetadata)
        .map(({ openGraphLocale }) => openGraphLocale)
        .filter((candidate) => candidate !== details.openGraphLocale),
      description,
      images: [{ url: getAbsoluteUrl(image) }],
      locale: details.openGraphLocale,
      siteName: details.name,
      title: socialTitle,
      type: "website",
      url: getAbsoluteUrl(pathname),
    },
    ...(noIndex ? { robots: { follow: false, index: false } } : {}),
    title: title ?? { absolute: details.name },
    twitter: {
      card: "summary_large_image",
      description,
      images: [getAbsoluteUrl(image)],
      title: socialTitle,
    },
  };
}
