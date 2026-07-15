import type { Metadata } from "next";

import { StaticPage } from "@/features/static-page/static-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("zh-CN");

export const metadata: Metadata = buildPageMetadata({
  description: identity.about,
  locale: "zh-CN",
  pathname: "/about/",
  title: identity.aboutTitle,
});

export default function AboutPage() {
  return (
    <StaticPage
      description={identity.about}
      index="05"
      title={identity.aboutTitle}
    />
  );
}
