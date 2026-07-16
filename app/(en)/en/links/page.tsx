import type { Metadata } from "next";

import { friendsContent } from "@/features/friends/friends-content";
import { FriendsPage } from "@/features/friends/friends-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const locale = "en";
const identity = getLocalizedSiteConfig(locale);

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.links,
  locale,
  pathname: "/en/links/",
  title: friendsContent[locale].title,
});

export default function EnglishLinksPage() {
  return <FriendsPage locale={locale} />;
}
