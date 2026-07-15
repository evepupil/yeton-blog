import type { Metadata } from "next";

import { StaticPage } from "@/features/static-page/static-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description: "独立开发者，也是一名长期写作者。",
  locale: "zh-CN",
  pathname: "/about/",
  title: "关于林墨",
});

export default function AboutPage() {
  return (
    <StaticPage
      description="独立开发者，也是一名长期写作者。"
      index="05"
      title="关于林墨"
    />
  );
}
