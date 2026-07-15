import type { Metadata } from "next";

import { ArchivePage } from "@/features/archives/archive-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description: "按年份查看林墨手记已经发布的文章。",
  locale: "zh-CN",
  pathname: "/archives/",
  title: "文章归档",
});

export default function ArchivesPage() {
  return <ArchivePage locale="zh-CN" />;
}
