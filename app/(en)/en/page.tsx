import type { Metadata } from "next";

import { HomePage } from "@/features/home/home-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = buildPageMetadata({
  description: siteConfig.englishDescription,
  locale: "en",
  pathname: "/en/",
});

export default function EnglishHomePage() {
  return <HomePage locale="en" />;
}
