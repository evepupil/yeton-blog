import { XMLBuilder } from "fast-xml-parser";

import { getPostHref } from "@/features/posts/post-links";
import { getPublishedArticles } from "@/lib/content/queries";
import type { Article } from "@/lib/content/types";
import { getAbsoluteUrl, getLocaleDescription } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site-config";
import type { SiteLocale } from "@/lib/site-config";

const feedMetadata = {
  "zh-CN": {
    path: "/rss.xml",
    title: siteConfig.brand.name["zh-CN"],
  },
  en: {
    path: "/en/rss.xml",
    title: siteConfig.brand.name.en,
  },
} as const satisfies Record<SiteLocale, object>;

export function buildRssFeed(
  articles: readonly Article[],
  locale: SiteLocale,
): string {
  const publishedArticles = getPublishedArticles(articles, locale);
  const details = feedMetadata[locale];
  const homePath = locale === "en" ? "/en/" : "/";
  const selfUrl = getAbsoluteUrl(details.path).toString();

  const document = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "UTF-8",
    },
    rss: {
      "@_version": "2.0",
      "@_xmlns:atom": "http://www.w3.org/2005/Atom",
      channel: {
        "atom:link": {
          "@_href": selfUrl,
          "@_rel": "self",
          "@_type": "application/rss+xml",
        },
        description: getLocaleDescription(locale),
        item: publishedArticles.map((article) => {
          const articleUrl = getAbsoluteUrl(
            getPostHref(locale, article.slug),
          ).toString();

          return {
            description: article.description,
            guid: {
              "#text": articleUrl,
              "@_isPermaLink": "true",
            },
            link: articleUrl,
            pubDate: new Date(
              `${article.published}T00:00:00.000Z`,
            ).toUTCString(),
            title: article.title,
          };
        }),
        language: locale,
        lastBuildDate: new Date(
          `${publishedArticles[0]?.published ?? "1970-01-01"}T00:00:00.000Z`,
        ).toUTCString(),
        link: getAbsoluteUrl(homePath).toString(),
        title: details.title,
      },
    },
  };

  const builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    suppressBooleanAttributes: false,
    suppressEmptyNode: true,
  });

  return builder.build(document);
}
