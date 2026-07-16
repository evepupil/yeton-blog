import { siteConfig } from "@/site.config";
import type { SiteLocale } from "@/site.config";

export {
  siteConfig,
  supportedLocales,
  type LocalizedText,
  type SiteLocale,
  type SocialPlatform,
  type UmamiAnalyticsConfig,
} from "@/site.config";

export function getLocalizedSiteConfig(locale: SiteLocale) {
  return {
    about: siteConfig.author.about[locale],
    aboutTitle: siteConfig.author.aboutTitle[locale],
    authorAvatarAlt: siteConfig.author.avatar.alt[locale],
    authorBio: siteConfig.author.bio[locale],
    authorName: siteConfig.author.name[locale],
    description: siteConfig.brand.description[locale],
    footerLine: siteConfig.brand.footerLine[locale],
    homeTitle: siteConfig.author.homeTitle[locale],
    name: siteConfig.brand.name[locale],
    sectionDescriptions: {
      archives: siteConfig.sectionDescriptions.archives[locale],
      books: siteConfig.sectionDescriptions.books[locale],
      links: siteConfig.sectionDescriptions.links[locale],
      posts: siteConfig.sectionDescriptions.posts[locale],
    },
  } as const;
}

const localSiteUrl = "http://localhost:3000";

export function resolveSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): URL {
  const siteUrl = new URL(value ?? localSiteUrl);

  if (!new Set(["http:", "https:"]).has(siteUrl.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  return siteUrl;
}
