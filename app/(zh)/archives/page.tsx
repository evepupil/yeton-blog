import type { Metadata } from "next";

import { ArchivePage } from "@/features/archives/archive-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("zh-CN");

export const metadata: Metadata = buildPageMetadata({
  description: identity.sectionDescriptions.archives,
  locale: "zh-CN",
  pathname: "/archives/",
  title: "文章归档",
});

export default function ArchivesPage() {
  return <ArchivePage locale="zh-CN" />;
}
