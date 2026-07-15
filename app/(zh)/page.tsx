import type { Metadata } from "next";

import { HomePage } from "@/features/home/home-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = buildPageMetadata({
  description: siteConfig.description,
  locale: "zh-CN",
  pathname: "/",
});

export default function ChineseHomePage() {
  return <HomePage locale="zh-CN" />;
}
