import type { Metadata } from "next";

import { HomePage } from "@/features/home/home-page";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLocalizedSiteConfig } from "@/lib/site-config";

const identity = getLocalizedSiteConfig("en");

export const metadata: Metadata = buildPageMetadata({
  description: identity.description,
  locale: "en",
  pathname: "/en/",
});

export default function EnglishHomePage() {
  return <HomePage locale="en" />;
}
