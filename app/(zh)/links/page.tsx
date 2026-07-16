import type { Metadata } from "next";

import { friendsContent } from "@/features/friends/friends-content";
import { FriendsPage } from "@/features/friends/friends-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const locale = "zh-CN";
const identity = getLocalizedSiteConfig(locale);

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.links,
  locale,
  pathname: "/links/",
  title: friendsContent[locale].title,
});

export default function LinksPage() {
  return <FriendsPage locale={locale} />;
}
