import type { Metadata } from "next";

import { StaticPage } from "@/features/static-page/static-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("en");

export const metadata: Metadata = buildPageMetadata({
  description: identity.about,
  locale: "en",
  pathname: "/en/about/",
  title: identity.aboutTitle,
});

export default function EnglishAboutPage() {
  return (
    <StaticPage
      description={identity.about}
      index="05"
      title={identity.aboutTitle}
    />
  );
}
