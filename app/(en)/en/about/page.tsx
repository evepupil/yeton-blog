import type { Metadata } from "next";

import { StaticPage } from "@/features/static-page/static-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description: "Independent builder and long-time writer.",
  locale: "en",
  pathname: "/en/about/",
  title: "About Lin Mo",
});

export default function EnglishAboutPage() {
  return (
    <StaticPage
      description="Independent builder and long-time writer."
      index="05"
      title="About Lin Mo"
    />
  );
}
