import type { Metadata } from "next";

import { HomePage } from "@/features/home/home-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("zh-CN");

export const metadata: Metadata = buildPageMetadata({
  description: identity.description,
  locale: "zh-CN",
  pathname: "/",
});

export default function ChineseHomePage() {
  return <HomePage locale="zh-CN" />;
}
