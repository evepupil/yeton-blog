import type { Metadata } from "next";

import { AboutPageView } from "@/features/about/about-page";
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
  return <AboutPageView locale="zh-CN" />;
}
